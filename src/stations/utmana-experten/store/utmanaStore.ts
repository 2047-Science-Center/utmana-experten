/**
 * Pinia-store — den komponerbara steg-motorns orkestrering. Kärnan är en
 * SEKVENSERARE som kör format.steps[] i ordning; ingen fast fas-enum, steget
 * avgör beteendet. Två lägen på SAMMA motor:
 *   self = motorn driver fram automatiskt (timer/knapp), obemannad.
 *   gm   = spelledaren i Blocks bestämmer när nästa steg börjar (gm/nasta);
 *          motorn pausar mellan steg.
 *
 * Röstning = arkadknappar (ingen röstigenkänning). Web Speech används BARA i
 * speak_round (tänk-turen → turns[] → /assess). Lager-1-cues publiceras genom
 * hela sekvensen via rig-adaptern (appen känner aldrig lager 2 = pixlar).
 */
import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'

import { createAdapters, type Adapters } from '@/station-kit/adapters'
import type { ResultPayload, ResultPerson } from '@/station-kit/adapters/result/ResultSink'
import type { Scen, KnappEvent, GmEvent } from '@/station-kit/adapters/rig/Rig'
import { audio } from '@/station-kit/audio/AudioEngine'
import { t } from '@/station-kit/i18n'
import { config, seatName } from '@/config'

import type { FormatDef, Step, Vote, Turn, SeatAssessment, VoteStep, SpeakRoundStep, AssessStep, FacitStep } from '../engine/types'
import { currentStep as currentOf, isDone, nextIndex, nextSeat, attitydDelta } from '../engine/sequencer'
import { interpretKnapp } from '../engine/knapp'
import { formatById, DEFAULT_FORMAT_ID } from '../formats'

export type Mode = 'self' | 'gm'

/** scen-cue per stegtyp (null = ändra inte scenen). */
const SCEN_OF: Partial<Record<Step['typ'], Scen>> = {
  present: 'present',
  vote: 'vote',
  speak_round: 'speak',
  facit: 'facit',
  feedback: 'facit',
  clip: 'reality',
  reveal: 'verdict',
}

const PRESENTATIONAL: Step['typ'][] = ['present', 'clip', 'facit', 'feedback', 'reveal']

export const useUtmanaStore = defineStore('utmana', () => {
  // --- Grund ---
  const adapters = shallowRef<Adapters | null>(null)
  const format = ref<FormatDef | null>(null)
  const mode = ref<Mode>('self')
  const started = ref(false)
  const finished = ref(false)
  const stepIndex = ref(0)
  const awaitingNext = ref(false) // gm: steget klart, väntar på spelledaren
  const masterLocked = ref(false) // gm/master=1 → tysta appens cues

  // --- Grupp / platser ---
  const seats = ref<number[]>(Array.from({ length: config.seats }, (_, i) => i + 1))
  const groupId = ref('pilot')
  /** Inskrivna spelarnamn per plats (tomt → platshållare via displayName). */
  const playerNames = ref<Record<number, string>>({})

  // --- Rundans data ---
  const votes = ref<Record<string, Vote[]>>({}) // keyad på matpunkt (fore/efter/annan)
  const turns = ref<Turn[]>([])
  const spokeSeats = ref<number[]>([])
  const assessments = ref<SeatAssessment[]>([])
  const facitRatt = ref<string | null>(null)

  // --- Tänk-tur ---
  const activePlats = ref(0)
  const currentSpeakSeconds = ref<number>(config.speakSeconds)
  const turnEndSignal = ref(0) // bumpas av en aktiv plats knapp → komponenten finaliserar

  // --- UI-flaggor ---
  const assessing = ref(false)
  const speaking = ref(false)
  const paused = ref(false)

  // --- Härledda ---
  const steps = computed<Step[]>(() => format.value?.steps ?? [])
  const current = computed<Step | null>(() => (started.value ? currentOf(steps.value, stepIndex.value) : null))
  const stepType = computed<Step['typ'] | null>(() => current.value?.typ ?? null)
  const currentMatpunkt = computed<string | null>(() =>
    current.value?.typ === 'vote' ? (current.value as VoteStep).matpunkt ?? 'other' : null,
  )
  const currentVotes = computed<Vote[]>(() => (currentMatpunkt.value ? votes.value[currentMatpunkt.value] ?? [] : []))
  const allSeatsVoted = computed(
    () => currentVotes.value.length >= seats.value.length && seats.value.every((s) => currentVotes.value.some((v) => v.plats === s)),
  )
  const delta = computed(() => attitydDelta(votes.value['fore'] ?? [], votes.value['efter'] ?? []))

  // --- Cue-hjälpare: tysta lager-1 när spelledaren tagit över riggen (master) ---
  function cue(fn: (rig: NonNullable<Adapters['rig']>) => void): void {
    const rig = adapters.value?.rig
    if (rig && !masterLocked.value) fn(rig)
  }

  function init(): void {
    if (adapters.value) return
    adapters.value = createAdapters()
    adapters.value.rig.onKnapp((e: KnappEvent) => onKnapp(e.plats, e.knapp))
    adapters.value.rig.onGm((e: GmEvent) => onGm(e))
    cue((r) => r.scen('attract'))
  }

  // --- Val av format / läge ---
  function selectFormat(id: string): void {
    format.value = formatById(id) ?? formatById(DEFAULT_FORMAT_ID) ?? null
  }
  function setMode(m: Mode): void {
    mode.value = m
  }

  // --- Spelarnamn (incheckning) ---
  function setPlayerName(plats: number, name: string): void {
    playerNames.value = { ...playerNames.value, [plats]: name }
  }
  /** Visningsnamn: inskrivet namn om satt, annars platshållare. */
  function displayName(plats: number): string {
    const n = playerNames.value[plats]
    return n && n.trim() ? n.trim() : seatName(plats)
  }

  // --- Start / sekvensering ---
  function start(): void {
    if (!format.value) selectFormat(DEFAULT_FORMAT_ID)
    resetRunData()
    started.value = true
    finished.value = false
    stepIndex.value = 0
    enterStep()
  }

  function enterStep(): void {
    awaitingNext.value = false
    const step = current.value
    if (!step) return finish()
    const scen = SCEN_OF[step.typ]
    if (scen) cue((r) => r.scen(scen))

    switch (step.typ) {
      case 'vote':
        activePlats.value = 0
        cue((r) => r.aktivPlats(0))
        break
      case 'speak_round':
        beginSpeakRound(step as SpeakRoundStep)
        break
      case 'assess':
        void runAssess(step as AssessStep)
        break
      case 'facit': {
        const ratt = (step as FacitStep).ratt ?? format.value?.facit ?? null
        facitRatt.value = ratt
        if (ratt) cue((r) => r.facitRatt(ratt))
        break
      }
      case 'reveal':
        cue((r) => r.ljud('fanfar'))
        audio.play('win')
        break
      default:
        break
    }
  }

  /** Ett steg är klart: self → nästa direkt; gm → vänta på spelledaren. */
  function stepComplete(): void {
    if (mode.value === 'gm') {
      awaitingNext.value = true
      return
    }
    next()
  }

  /** Gå till nästa steg (self auto, eller gm/nasta / facilitator). */
  function next(): void {
    stepIndex.value = nextIndex(steps.value, stepIndex.value)
    if (isDone(steps.value, stepIndex.value)) return finish()
    enterStep()
  }

  function finish(): void {
    started.value = false
    finished.value = true
    activePlats.value = 0
    cue((r) => r.aktivPlats(0))
    cue((r) => r.scen('verdict'))
    sendResult()
  }

  // --- Röstning (arkadknapp) ---
  function castVote(plats: number, val: string): void {
    const key = currentMatpunkt.value
    if (!key) return
    const list = votes.value[key] ? [...votes.value[key]] : []
    const i = list.findIndex((v) => v.plats === plats)
    if (i >= 0) list[i] = { plats, val }
    else list.push({ plats, val })
    votes.value = { ...votes.value, [key]: list }
    cue((r) => r.rost(plats, val))
    audio.play('confirm')
    if (mode.value === 'self' && allSeatsVoted.value) {
      window.setTimeout(() => {
        if (stepType.value === 'vote' && allSeatsVoted.value) stepComplete()
      }, 900)
    }
  }

  // --- Tänk-tur ---
  function beginSpeakRound(step: SpeakRoundStep): void {
    turns.value = []
    spokeSeats.value = []
    currentSpeakSeconds.value = step.sekunder ?? config.speakSeconds
    const first = nextSeat(seats.value, 0)
    activePlats.value = first ?? 0
    if (first) {
      cue((r) => r.aktivPlats(first))
      cue((r) => r.timer(first, currentSpeakSeconds.value))
    } else {
      stepComplete()
    }
  }

  /** Finalisera en plats tur (från timer-slut ELLER aktiv plats "klar"-knapp). */
  function endTurn(plats: number, transcript: string): void {
    if (plats !== activePlats.value || activePlats.value === 0) return
    turns.value = [...turns.value, { speaker: `plats ${plats}`, transcript: transcript.trim() }]
    if (!spokeSeats.value.includes(plats)) spokeSeats.value = [...spokeSeats.value, plats]
    audio.play('blip')
    const nxt = nextSeat(seats.value, plats)
    if (nxt) {
      activePlats.value = nxt
      cue((r) => r.aktivPlats(nxt))
      cue((r) => r.timer(nxt, currentSpeakSeconds.value))
    } else {
      activePlats.value = 0
      cue((r) => r.aktivPlats(0))
      cue((r) => r.timer(0))
      stepComplete()
    }
  }

  // --- AI-bedömning (per person, frysta multi-speaker-kontraktet) ---
  async function runAssess(step: AssessStep): Promise<void> {
    assessing.value = true
    assessments.value = []
    const ad = adapters.value
    const seatsToAssess = spokeSeats.value.length ? spokeSeats.value : seats.value.filter((s) => turns.value.some((t) => t.speaker === `plats ${s}`))
    try {
      const turnList = turns.value.map((t) => ({ speaker: t.speaker, transcript: t.transcript }))
      const fraga = format.value?.fraga
      const facit = format.value?.facit
      const out: SeatAssessment[] = []
      if (step.perPerson !== false && seatsToAssess.length) {
        for (const plats of seatsToAssess) {
          try {
            const res = await ad!.assess.assess(step.configId, { turns: turnList, focus: `plats ${plats}`, fraga, facit }, { lang: config.lang, groupId: groupId.value })
            out.push({ plats, band: str(res.assessment.band), svar_text: str(res.assessment.svar_text) || t('npc.error') })
          } catch (err) {
            console.warn('[utmana] assess misslyckades plats', plats, err)
            out.push({ plats, svar_text: t('npc.error') })
          }
        }
      } else {
        // Ett anrop med gemensamt utfall (perPerson:false).
        const res = await ad!.assess.assess(step.configId, { turns: turnList, fraga, facit }, { lang: config.lang, groupId: groupId.value })
        out.push({ plats: 0, band: str(res.assessment.band), svar_text: str(res.assessment.svar_text) || t('npc.error') })
      }
      assessments.value = out
    } catch (err) {
      console.warn('[utmana] assess-steg misslyckades', err)
      assessments.value = seatsToAssess.map((plats) => ({ plats, svar_text: t('npc.error') }))
    } finally {
      assessing.value = false
      stepComplete()
    }
  }

  async function speakNpc(text: string): Promise<void> {
    const sp = adapters.value?.speak
    if (!sp || !sp.enabled) return
    speaking.value = true
    try {
      await sp.speak(text)
    } finally {
      speaking.value = false
    }
  }

  // --- EN inväg för knapp (hårdvara MQTT + on-screen) ---
  function onKnapp(plats: number, knapp: string): void {
    const step = current.value
    const action = interpretKnapp({
      stepType: step?.typ ?? null,
      plats,
      knapp,
      allowedVals: step?.typ === 'vote' ? (step as VoteStep).val : undefined,
      activePlats: activePlats.value,
    })
    if (action.kind === 'vote') {
      castVote(action.plats, action.val)
    } else if (action.kind === 'turn-advance') {
      turnEndSignal.value += 1 // komponenten finaliserar capturen → endTurn()
    } else if (step && PRESENTATIONAL.includes(step.typ) && mode.value === 'self') {
      // presentationssteg: valfri knapp = fortsätt (obemannad drift)
      stepComplete()
    }
  }

  // --- Spelledare (Blocks → gm/<cmd>) ---
  function onGm(e: GmEvent): void {
    switch (e.cmd) {
      case 'format':
        selectFormat(e.value)
        break
      case 'mode':
        setMode(e.value === 'gm' ? 'gm' : 'self')
        break
      case 'start':
        start()
        break
      case 'nasta':
        if (started.value) next()
        break
      case 'master':
        masterLocked.value = e.value === '1'
        break
      default:
        break // musik/alla_slack/plats/spot hanteras av hjärnan/Blocks, inte appen
    }
  }

  // --- Facilitator ---
  function togglePause(): void {
    paused.value = !paused.value
  }
  function quitStation(): void {
    try {
      adapters.value?.rig.close()
      window.close()
    } catch {
      /* no-op */
    }
  }

  function resetRunData(): void {
    votes.value = {}
    turns.value = []
    spokeSeats.value = []
    assessments.value = []
    facitRatt.value = null
    activePlats.value = 0
    paused.value = false
  }

  function reset(): void {
    resetRunData()
    started.value = false
    finished.value = false
    awaitingNext.value = false
    stepIndex.value = 0
    playerNames.value = {}
    cue((r) => r.scen('attract'))
  }

  // --- Resultat-söm (AVSTÄNGD i pilot = MockResultSink). result_value = delta. ---
  function sendResult(): void {
    const d = delta.value
    const value = d.andrade
    const personer: ResultPerson[] = seats.value.map((plats) => ({
      band_id: `${groupId.value}-plats${plats}`,
      chosen_role: 'A',
      assigned_role: 'A',
      role_presented_as: null,
      result_value: value,
    }))
    const payload: ResultPayload = {
      grupp: groupId.value,
      rollresultat_A: value,
      rollresultat_B: 0,
      personer,
    }
    adapters.value?.result.send(payload)
  }

  return {
    // state
    format, mode, started, finished, stepIndex, awaitingNext, masterLocked,
    seats, groupId, playerNames, votes, turns, spokeSeats, assessments, facitRatt,
    activePlats, currentSpeakSeconds, turnEndSignal, assessing, speaking, paused,
    // derived
    steps, current, stepType, currentMatpunkt, currentVotes, allSeatsVoted, delta,
    // actions
    init, selectFormat, setMode, start, next, stepComplete, enterStep,
    onKnapp, onGm, castVote, endTurn, speakNpc, togglePause, quitStation, reset,
    setPlayerName, displayName,
  }
})

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}
