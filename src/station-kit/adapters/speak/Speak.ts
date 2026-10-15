/**
 * /speak — ren, icke-essentiell röst-add-on (ElevenLabs, server-side nyckel).
 * Läser ENBART upp det dynamiska NPC-svaret (`svar_text`), den enda text som
 * inte kan förinspelas. Text är alltid grunden OCH fallbacken: hela stationen
 * är fullt spelbar utan någon TTS.
 *
 * Kontrakt: aldrig på kritiska vägen. Är den av (`speak.enabled=false`) eller
 * fallerar anropet sväljs felet tyst och texten står kvar.
 */
export interface Speak {
  /** Är röst påslagen i denna körning. */
  readonly enabled: boolean
  /** Läs upp texten (best-effort). Resolvar även vid fel — kastar aldrig. */
  speak(text: string): Promise<void>
  /** Avbryt ev. pågående uppläsning (t.ex. vid NÄSTA ▸). */
  cancel(): void
}
