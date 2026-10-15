/**
 * Enda /assess-implementationen: POST {baseUrl}/assess mot gatewayen. INGEN
 * MockAssess — AI:n byggs på riktigt i båda lägen. `configId` skickas per anrop.
 * (Samma POST-mönster som Minnestestet; input-formen är den frysta multi-speaker.)
 */
import type { Assess, AssessInput, AssessMeta, AssessResult } from './Assess'

export class HttpAssess implements Assess {
  constructor(private readonly baseUrl: string) {}

  async assess(configId: string, input: AssessInput, meta: AssessMeta): Promise<AssessResult> {
    const url = `${this.baseUrl.replace(/\/+$/, '')}/assess`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId, input, meta }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`assess ${res.status}: ${text.slice(0, 200)}`)
    }
    const json = (await res.json()) as Partial<AssessResult>
    if (!json || typeof json !== 'object' || !json.assessment) {
      throw new Error('assess: saknar assessment i svaret')
    }
    return {
      configId: json.configId ?? configId,
      assessment: json.assessment,
      speech: json.speech,
      meta: json.meta,
    }
  }
}
