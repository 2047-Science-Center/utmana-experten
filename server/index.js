/**
 * Lokal AI-gateway för Utmana experten (Node/Express, gptbackend-mönstret). Det
 * frysta /assess-kontraktet (kontrakt-assess-gateway.md): multi-speaker-input
 * (turns[] + focus = perPerson), strukturerad `assessment` ut. Gatewayen är TOM
 * på stationslogik — all variation i configs/<id>.json + instructions/*.txt.
 *
 * Attityd-delta (siffran) räknas i FRONTEN ur rösterna (före→efter), inte här —
 * modellen skriver bara den personliga återkopplingen (band + svar_text).
 *
 *   npm run gateway   (kräver server/.env med AI_API_KEY=...)
 */
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const PORT = process.env.PORT || 8787
const API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY

if (!API_KEY) {
  console.warn(
    '[gateway] VARNING: ingen AI_API_KEY i server/.env — /assess svarar 500 tills en nyckel läggs in.',
  )
}

const openai = API_KEY ? new OpenAI({ apiKey: API_KEY }) : null

// --- Config-laddning (cache) ---
const configCache = new Map()
function loadConfig(configId) {
  if (!/^[a-z0-9_-]+$/i.test(configId)) throw new Error('ogiltigt configId')
  if (configCache.has(configId)) return configCache.get(configId)
  const file = path.join(__dirname, 'configs', `${configId}.json`)
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'))
  cfg._instructions = fs.readFileSync(path.join(__dirname, cfg.instructionsFile), 'utf8').trim()
  configCache.set(configId, cfg)
  return cfg
}

// --- JSON-parsning med reparation (ingen naken JSON.parse) ---
function parseJsonLoose(raw) {
  if (raw && typeof raw === 'object') return raw
  let s = String(raw ?? '').trim()
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1)
  return JSON.parse(s)
}

const BANDS = ['Stark', 'Godkänd', 'Svag']

/** Tvinga modellsvaret till outputSchema-formen { band, svar_text }. */
function coerceAssessment(obj) {
  const o = obj ?? {}
  const band = BANDS.includes(o.band) ? o.band : 'Godkänd'
  return { band, svar_text: String(o.svar_text ?? '').trim() }
}

// --- Prompt-byggare: injicerar turns/focus/fråga/facit i input ---
function turnsBlock(turns) {
  if (!Array.isArray(turns) || turns.length === 0) return '(tyst — inget sades)'
  return turns.map((t) => `- ${t.speaker}: "${String(t.transcript || '').trim() || '(tyst)'}"`).join('\n')
}

function buildAssessInput(input) {
  const lines = []
  if (input.fraga) lines.push(`FRÅGAN GRUPPEN TOG STÄLLNING TILL: ${input.fraga}`)
  if (Array.isArray(input.alternativ) && input.alternativ.length) {
    lines.push(`ALTERNATIVEN DE VALDE MELLAN: ${input.alternativ.join(' · ')}`)
  }
  if (input.facit) lines.push(`FACIT (det svar som stämmer bäst): ${input.facit}`)
  lines.push('HELA TURORDNINGEN (märkt per plats — sekvensen avgör vem som pratar):', turnsBlock(input.turns))
  if (input.focus) {
    lines.push(
      `BEDÖM NU: ${input.focus}. Ge konstruktiv, personlig återkoppling till JUST den platsen`,
      '(vad var den bra på, vad missades), med resten av turordningen som kontext.',
    )
  } else {
    lines.push('BEDÖM gruppens resonemang som helhet.')
  }
  lines.push('Svara med ett enda giltigt JSON-objekt enligt schemat: { "band": "...", "svar_text": "..." }')
  return lines.join('\n')
}

async function callModelJson(model, instructions, input, cfg) {
  if (!openai) throw new Error('ingen AI_API_KEY konfigurerad i server/.env')
  const req = { model, instructions, input }
  if (cfg && cfg.reasoningEffort) req.reasoning = { effort: cfg.reasoningEffort }
  if (cfg && cfg.maxOutputTokens) req.max_output_tokens = cfg.maxOutputTokens
  if (cfg && cfg.jsonMode) req.text = { format: { type: 'json_object' } }
  const response = await openai.responses.create(req)
  return parseJsonLoose(response.output_text)
}

// --- Server ---
const app = express()
app.use(express.json({ limit: '256kb' }))
app.use(cors())

app.get('/health', (_req, res) => res.json({ ok: true, keyed: Boolean(openai) }))
app.get('/healthz', (_req, res) => res.type('text/plain').send('ok'))

app.post('/assess', async (req, res) => {
  const started = Date.now()
  try {
    const { configId, input, meta } = req.body ?? {}
    if (!configId || !input) return res.status(400).json({ error: 'configId och input krävs' })
    const cfg = loadConfig(configId)
    const model = (meta && meta.modelOverride) || cfg.model

    const raw = await callModelJson(model, cfg._instructions, buildAssessInput(input), cfg)
    const assessment = coerceAssessment(raw)

    const out = { configId, assessment, meta: { model, latencyMs: Date.now() - started } }
    if (cfg.speak && cfg.speak.enabled) {
      out.speech = { text: assessment.svar_text, voiceId: cfg.speak.voiceId }
    }
    return res.json(out)
  } catch (err) {
    console.error('[gateway] /assess fel:', err)
    return res.status(500).json({ error: String(err.message || err) })
  }
})

/**
 * /speak (ElevenLabs) — läser upp svar_text. Icke-essentiell add-on: fronten
 * sväljer icke-2xx tyst. Nyckel via server/.env (ELEVENLABS_API_KEY).
 */
app.post('/speak', async (req, res) => {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return res.status(503).json({ error: 'ELEVENLABS_API_KEY saknas i server/.env' })
  try {
    const { configId = 'utmana-tyck-till', text } = req.body ?? {}
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text krävs' })
    const cfg = loadConfig(configId)
    const speak = cfg.speak
    if (!speak || !speak.voiceId) return res.status(500).json({ error: 'ingen röst i config' })

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${speak.voiceId}`
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: String(text),
        model_id: speak.modelId || 'eleven_multilingual_v2',
        voice_settings: speak.voiceSettings || undefined,
      }),
    })
    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      console.warn('[gateway] /speak ElevenLabs-fel', r.status, detail.slice(0, 200))
      return res.status(502).json({ error: `elevenlabs ${r.status}` })
    }
    const buf = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    return res.send(buf)
  } catch (err) {
    console.error('[gateway] /speak fel:', err)
    return res.status(500).json({ error: String(err.message || err) })
  }
})

/**
 * /mic/:plats — HÅRDKODAD mic per spelare. Sätter systemets default-input till
 * MIC_PLATS<plats> (ur server/.env) via `pactl set-default-source`. Tänk-turen
 * (SpeakRoundStep) anropar detta FÖRE varje tur, så varje spelare talar i sin
 * egen Volt-mic (Web Speech binder mot default-inputen). No-op om MIC_PLATS<n>
 * saknas → oförändrat enmic-beteende. Linux/pactl (PulseAudio/PipeWire).
 */
app.get('/mic/:plats', (req, res) => {
  const plats = String(req.params.plats || '').replace(/\D/g, '')
  const src = plats ? process.env[`MIC_PLATS${plats}`] : ''
  if (!src) return res.json({ ok: false, skipped: `ingen MIC_PLATS${plats || '?'} satt` })
  execFile('pactl', ['set-default-source', src], (err) => {
    if (err) {
      console.warn('[gateway] /mic pactl-fel:', err.message)
      return res.status(500).json({ ok: false, error: String(err.message) })
    }
    return res.json({ ok: true, plats: Number(plats), source: src })
  })
})

// --- Servera den byggda appen (kiosk-drift: EN process, samma origin) ---
const DIST = path.join(__dirname, '..', 'dist')
if (fs.existsSync(path.join(DIST, 'index.html'))) {
  app.use(express.static(DIST))
  // Spelledar-fönstret (egen sida) — ren URL utan .html för surfplattan.
  app.get('/spelledare', (_req, res) => res.sendFile(path.join(DIST, 'spelledare.html')))
  // SPA-fallback för stationen (allt annat → index.html).
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')))
  console.log('[gateway] serverar byggd app från', DIST)
}

app.listen(PORT, () => {
  console.log(`[gateway] lyssnar på http://localhost:${PORT}  (keyed: ${Boolean(openai)})`)
})
