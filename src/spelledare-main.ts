/**
 * Entry för SPELLEDAR-fönstret (egen sida: spelledare.html). Ingen Pinia, ingen
 * spellogik — bara en MQTT-styrd fjärrkontroll (SpelledareApp) som speglar
 * stationens motor via <root>/status och styr den via <root>/gm/*.
 */
import { createApp } from 'vue'
import SpelledareApp from './stations/utmana-experten/spelledare/SpelledareApp.vue'
import './stations/utmana-experten/theme/gameshow.css'

createApp(SpelledareApp).mount('#app')
