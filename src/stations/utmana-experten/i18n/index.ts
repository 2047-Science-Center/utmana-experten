/**
 * Registrerar Utmana expertens copy i kitets i18n-bundle. Anropas en gång i
 * main.ts före mount. All station-copy bor HÄR (i stationen), inte i kitet.
 */
import { registerMessages } from '@/station-kit/i18n'
import { sv } from './sv'
import { no } from './no'
import { svorsk } from './svorsk'

export function registerStationMessages(): void {
  registerMessages('sv', sv)
  registerMessages('no', no)
  registerMessages('svorsk', svorsk)
}
