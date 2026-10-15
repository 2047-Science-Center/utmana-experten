/**
 * /assess-kontraktet — den frysta AI-gateway-sömmen (kontrakt-assess-gateway.md).
 * Generellt JSON-drivet anrop: `configId` väljer gateway-config (regelverk +
 * outputSchema), `input` har en av tre kanoniska former (configens inputMode
 * avgör), gatewayen svarar med strukturerad `assessment` (+ valfri `speech`).
 *
 * Utmana experten använder `multi-speaker`: en märkt turordning (turns[]) +
 * `focus` = vilken plats detta anrop bedömer (perPerson → ett anrop per plats).
 * Ingen stationslogik i adaptern eller gatewayen — all variation bor i config.
 */

export interface AssessTurn {
  /** Märkt talare, t.ex. "plats 2". Sekvensen (inte diarisering) avgör vem. */
  speaker: string
  transcript: string
}

/** Tre kanoniska input-former; configens inputMode avgör vilken gatewayen väntar. */
export type AssessInput =
  | { transcript: string }
  | { fields: Record<string, string> }
  | {
      turns: AssessTurn[]
      /** perPerson: vilken plats/talare detta anrop ska bedöma (t.ex. "plats 2"). */
      focus?: string
      /** Valfri frågekontext (formatets fråga, facit-svaret) för regelverket. */
      fraga?: string
      facit?: string
    }

export interface AssessMeta {
  lang: string
  modelOverride?: string
  groupId?: string
  sessionId?: string
}

/** Svaret. `assessment`-formen deklareras av configens outputSchema (t.ex.
 *  { band, svar_text } för utmana), så adaptern är agnostisk om innehållet. */
export interface AssessResult {
  configId: string
  assessment: Record<string, unknown>
  /** Finns om configen begär röst; fronten kan skicka text till /speak. */
  speech?: { text: string; voiceId?: string }
  meta?: { model?: string; latencyMs?: number; requestId?: string }
}

export interface Assess {
  assess(configId: string, input: AssessInput, meta: AssessMeta): Promise<AssessResult>
}
