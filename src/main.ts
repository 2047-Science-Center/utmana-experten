import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './station-kit/theme/crt.css'
import './stations/utmana-experten/theme/gameshow.css'
import { registerStationMessages } from './stations/utmana-experten/i18n'

// Station-specifik copy injiceras i kitets i18n (kitet självt hålls rent —
// bara mekanismen registerMessages() är generisk, alla strängar bor i stationen).
registerStationMessages()

createApp(App).use(createPinia()).mount('#app')
