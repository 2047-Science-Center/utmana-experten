/**
 * Resultat ut — X&Y-sömmen, PER PERSON (system 1 & 2 är individbaserade).
 * Kontrakt (§5.3): station<N>/result + station<N>/done.
 *
 * Matchar `results`-tabellen i X&Y-schemat (chosen_role, assigned_role,
 * role_presented_as, result_value). /assess (System 1, AI) kopplas SENARE.
 */

export interface ResultPerson {
  band_id: string
  chosen_role: 'A' | 'B'
  assigned_role: 'A' | 'B'
  role_presented_as: 'manlig' | 'kvinnlig' | null
  result_value: number
}

export interface ResultPayload {
  grupp: string
  rollresultat_A: number // summering (förhandlare)
  rollresultat_B: number // summering (rapportörer)
  personer: ResultPerson[]
}

export interface ResultSink {
  /** Skicka rundans resultat (station<N>/result) och markera klart (station<N>/done). */
  send(payload: ResultPayload): void
}
