/** Gemensamt stations-kit (Lager A) — importeras av alla fyra X&Y-stationer. */

export { default as CrtScreen } from './components/CrtScreen.vue'
export { default as Teletype } from './components/Teletype.vue'
export { default as CrtImage } from './components/CrtImage.vue'
export { default as AttractScreen } from './components/AttractScreen.vue'
export { default as MuteButton } from './components/MuteButton.vue'

export { audio } from './audio/AudioEngine'
export type { Sfx } from './audio/AudioEngine'

export { useI18n, t, setLang, getLang, registerMessages } from './i18n'
export type { Lang, Messages } from './i18n'

export * from './adapters'
