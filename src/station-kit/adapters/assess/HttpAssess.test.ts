import { describe, it, expect, vi, afterEach } from 'vitest'
import { HttpAssess } from './HttpAssess'
import type { AssessInput, AssessMeta } from './Assess'

const meta: AssessMeta = { lang: 'sv' }

const input: AssessInput = {
  turns: [
    { speaker: 'plats 1', transcript: 'jag tycker ja, för att det känns tryggt' },
    { speaker: 'plats 2', transcript: 'nej, man blir låst' },
  ],
  focus: 'plats 2',
  fraga: 'Är en fast anställning alltid tryggare?',
}

function mockFetch(body: unknown, ok = true, status = 200) {
  const calls: { url: string; init: RequestInit }[] = []
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return {
      ok,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response
  })
  ;(globalThis as unknown as { fetch: typeof fn }).fetch = fn
  return { fn, calls }
}

describe('HttpAssess — frysta multi-speaker-kontraktet', () => {
  afterEach(() => vi.restoreAllMocks())

  it('POSTar configId + input (turns/focus) + meta och plockar ut assessment', async () => {
    const assessment = { band: 'Stark', svar_text: 'Du vägde in otryggheten i det fasta.' }
    const { calls } = mockFetch({ configId: 'utmana-tyck-till', assessment, meta: { model: 'gpt-5-mini' } })
    const client = new HttpAssess('http://localhost:8787')

    const out = await client.assess('utmana-tyck-till', input, meta)
    expect(out.assessment).toEqual(assessment)
    expect(out.configId).toBe('utmana-tyck-till')

    expect(calls[0].url).toBe('http://localhost:8787/assess')
    expect(calls[0].init.method).toBe('POST')
    const sent = JSON.parse(calls[0].init.body as string)
    expect(sent.configId).toBe('utmana-tyck-till')
    expect(sent.input.turns).toHaveLength(2)
    expect(sent.input.focus).toBe('plats 2')
    expect(sent.meta.lang).toBe('sv')
  })

  it('trimmar dubbel slash i baseUrl', async () => {
    const { calls } = mockFetch({ assessment: {} })
    const client = new HttpAssess('http://localhost:8787/')
    await client.assess('utmana-tyck-till', input, meta).catch(() => undefined)
    expect(calls[0].url).toBe('http://localhost:8787/assess')
  })

  it('bär med speech om gatewayen returnerar det', async () => {
    const { } = mockFetch({
      assessment: { band: 'Godkänd', svar_text: 'Okej tänkt.' },
      speech: { text: 'Okej tänkt.', voiceId: 'sanna' },
    })
    const client = new HttpAssess('http://localhost:8787')
    const out = await client.assess('utmana-tyck-till', input, meta)
    expect(out.speech?.voiceId).toBe('sanna')
  })

  it('kastar vid icke-2xx', async () => {
    mockFetch({ error: 'boom' }, false, 500)
    const client = new HttpAssess('http://localhost:8787')
    await expect(client.assess('utmana-tyck-till', input, meta)).rejects.toThrow(/assess 500/)
  })

  it('kastar om assessment saknas', async () => {
    mockFetch({ meta: {} })
    const client = new HttpAssess('http://localhost:8787')
    await expect(client.assess('utmana-tyck-till', input, meta)).rejects.toThrow(/saknar assessment/)
  })
})
