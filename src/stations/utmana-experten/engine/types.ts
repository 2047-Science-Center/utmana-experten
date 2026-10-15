/**
 * Byggstenarna för den komponerbara steg-motorn. Ett format = en ordnad lista
 * av typade steg (data i configs/formats/<id>.json). Motorn är agnostisk —
 * byggstenens `typ` avgör beteendet, aldrig en hårdkodad fas-enum. Att lägga
 * till ett format = ny config, ingen kodändring.
 */

export type StepType =
  | 'present'
  | 'vote'
  | 'speak_round'
  | 'assess'
  | 'facit'
  | 'feedback'
  | 'clip'
  | 'reveal'

export interface PresentStep {
  typ: 'present'
  contentId: string
  /** "screen" = media på skärm; "irl" = titta-upp-banner (verkligheten). */
  source?: 'screen' | 'irl'
}

export interface VoteStep {
  typ: 'vote'
  /** Tillåtna val, speglar arkadknapparna (ja/nej/kanske). */
  val: string[]
  /** Mätpunkt för attityd-delta (före→efter), eller null = vanlig omröstning. */
  matpunkt?: 'fore' | 'efter' | null
}

export interface SpeakRoundStep {
  typ: 'speak_round'
  /** Sekunder per plats (default config.speakSeconds). */
  sekunder?: number
  /** Lagläge (framtid): flera platser per tur. Pilot = en plats i taget. */
  laglage?: boolean
}

export interface AssessStep {
  typ: 'assess'
  /** Gateway-config (regelverk + outputSchema) för bedömningen. */
  configId: string
  /** Ett /assess per plats (default) vs ett anrop med per-person-utfall. */
  perPerson?: boolean
}

export interface FacitStep {
  typ: 'facit'
  contentId: string
  /** facit-forst: visa facit → sedan feedback. tanke-forst: tvärtom. */
  ordning?: 'facit-forst' | 'tanke-forst'
  /** Vilket svar som är "rätt" (tänds på LED). Faller tillbaka på format.facit. */
  ratt?: string
}

export interface FeedbackStep {
  typ: 'feedback'
  /** Form på återkopplingen (pilot: "text-per-person"). */
  form?: string
}

export interface ClipStep {
  typ: 'clip'
  contentId: string
  rubrik?: string
}

export interface RevealStep {
  typ: 'reveal'
  /** Datakälla för revealen (default "delta" = före→efter-glappet). */
  kalla?: string
}

export type Step =
  | PresentStep
  | VoteStep
  | SpeakRoundStep
  | AssessStep
  | FacitStep
  | FeedbackStep
  | ClipStep
  | RevealStep

export interface FormatDef {
  id: string
  namn: string
  /** Markerar format med etiskt känsligt innehåll (syna-experten). */
  riskfyllt?: boolean
  /** Frågan gruppen tar ställning till (kontext till present/assess). */
  fraga?: string
  /** Facit-svaret (ja|nej|kanske) — vilket som tänds vid facit. */
  facit?: string
  steps: Step[]
  speak?: { enabled: boolean; voiceId?: string }
}

/** En registrerad röst (plats + val). */
export interface Vote {
  plats: number
  val: string
}

/** En märkt tänk-tur (sekvensen avgör talaren, inte diarisering). */
export interface Turn {
  speaker: string
  transcript: string
}

/** Per-plats-bedömning från AI:n. */
export interface SeatAssessment {
  plats: number
  band?: string
  svar_text: string
}
