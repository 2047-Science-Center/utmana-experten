/** Cue-tidslinje för intro-spelaren (audio + slides). Redigerbar per språk/block. */

export type IntroMode = 'center' | 'split' | 'negotiate'

export interface IntroCue {
  /** Sekunder på blockets ljudklocka. */
  time: number
  /** Foto som visas (Bild N). */
  photo: number
  /**
   * center = foto i mitten;
   * split = enkel-demo (foto vänster + illustration höger);
   * negotiate = förhandlingsdemo (foto överst ~70%, Nord/Syd-UI under).
   */
  mode: IntroMode
  /** Id för illustrationen (split) eller förhandlingsdemon (negotiate). */
  illustration?: string
  /** Retrospekt/minnesbild — fotot får filter + bultande "minne"-etikett. */
  memory?: boolean
}

/** Ett ljudblock i onboardingen. */
export interface IntroBlockDef {
  id: string
  audio: string
  subtitles?: string
  cues: IntroCue[]
}
