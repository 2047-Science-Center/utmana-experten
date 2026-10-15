/**
 * Liten i18n för stations-kitet. All text via nycklar — inga hårdkodade
 * strängar i UI:t. Interpolation ({param}) + enkel plural (|-separerad:
 * "ett|flera" väljs på {n}).
 *
 * Språk: svenska byggd nu; norska och svorsk stubbade (redo att fyllas).
 * Språkval sker i drift/admin-vyn, inte spelarvänt mitt i spelet.
 */

import { ref, computed } from 'vue'
import { sv } from './sv'
import { no } from './no'
import { svorsk } from './svorsk'
import { config } from '@/config'

export type Lang = 'sv' | 'no' | 'svorsk'
export type Messages = Record<string, string>

const bundles: Record<Lang, Messages> = { sv, no, svorsk }

const currentLang = ref<Lang>(config.lang)

export function setLang(lang: Lang): void {
  currentLang.value = lang
}

export function getLang(): Lang {
  return currentLang.value
}

/**
 * Generisk mekanism: en station registrerar sin egen copy in i språk-bundlen
 * (station-nycklar läggs till, ev. kollisioner med kitets defaults skrivs över).
 * Så hålls kitet rent — INGEN station-specifik copy i kitets sv.ts/no.ts; varje
 * station äger sina strängar i src/stations/<id>/i18n/ och matar in dem här.
 */
export function registerMessages(lang: Lang, patch: Messages): void {
  Object.assign(bundles[lang], patch)
}

function interpolate(template: string, params?: Record<string, unknown>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{${key}}`,
  )
}

/**
 * Slår upp `key` i aktivt språk (faller tillbaka till svenska, sedan nyckeln
 * själv). Plural: en sträng "singular|plural" väljs på params.n (n === 1).
 */
export function translate(
  lang: Lang,
  key: string,
  params?: Record<string, unknown>,
): string {
  const raw = bundles[lang][key] ?? bundles.sv[key] ?? key
  let text = raw
  if (raw.includes('|') && params && typeof params.n === 'number') {
    const [one, many] = raw.split('|')
    text = params.n === 1 ? one : many
  }
  return interpolate(text, params)
}

/** Reaktiv t() för Vue-komponenter. */
export function useI18n() {
  const t = (key: string, params?: Record<string, unknown>): string =>
    translate(currentLang.value, key, params)
  return { t, lang: computed(() => currentLang.value), setLang }
}

/** Icke-reaktiv t() för ren logik. */
export function t(key: string, params?: Record<string, unknown>): string {
  return translate(currentLang.value, key, params)
}
