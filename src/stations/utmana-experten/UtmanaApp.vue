<script setup lang="ts">
/**
 * Roten för Utmana experten (Designförslag B — "Marquee-skärm"). Studio-skalet
 * (marquee + HUD) omsluter aktuell vy: attract → steg-motorn → klar. Motorn
 * (store) är oförändrad; detta är vyerna. Facilitator/pilot-panel/mute ligger
 * som fixed-overlays utanför scenen så de aldrig klipps.
 */
import { ref, onMounted, computed } from 'vue'
import { audio } from '@/station-kit/audio/AudioEngine'
import { useUtmanaStore } from './store/utmanaStore'
import { DEFAULT_FORMAT_ID } from './formats'
import StudioFrame from './components/StudioFrame.vue'
import StepStage from './components/StepStage.vue'
import CheckinScreen from './components/CheckinScreen.vue'
import MuteButton from '@/station-kit/components/MuteButton.vue'
import FacilitatorControls from './components/FacilitatorControls.vue'
import PauseOverlay from './components/PauseOverlay.vue'
import PilotPanel from './components/PilotPanel.vue'

const store = useUtmanaStore()
const booted = ref(false)

onMounted(() => {
  store.init()
  if (!store.format) store.selectFormat(DEFAULT_FORMAT_ID)
})

function onAttractStart() {
  booted.value = true
  audio.unlock()
  audio.play('boot')
  // Går till incheckning (namn); CheckinScreen startar omgången.
}
function restart() {
  store.reset()
  booted.value = false
}

const showLobby = computed(() => booted.value && !store.started && !store.finished)
</script>

<template>
  <div>
    <StudioFrame :show-hud="booted">
      <!-- Attract -->
      <div v-if="!booted" class="screen--attract" @click="onAttractStart">
        <svg class="spark" style="width: 3cqw; height: 3cqw; top: 14%; left: 18%" viewBox="0 0 24 24"><path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill="currentColor" /></svg>
        <svg class="spark" style="width: 2cqw; height: 2cqw; top: 22%; right: 20%" viewBox="0 0 24 24"><path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill="currentColor" /></svg>
        <svg class="spark" style="width: 2.4cqw; height: 2.4cqw; bottom: 16%; left: 30%" viewBox="0 0 24 24"><path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill="currentColor" /></svg>
        <svg class="attract__planet" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="58" r="30" fill="#d4682e" />
          <circle cx="50" cy="48" r="9" fill="#e9915c" opacity=".7" />
          <ellipse cx="60" cy="60" rx="52" ry="16" fill="none" stroke="#c89b5e" stroke-width="4" transform="rotate(-18 60 60)" />
        </svg>
        <h1 class="wordmark">UTMANA<br /><b>EXPERTEN</b></h1>
        <p class="tagline">Ta ställning. Möt verkligheten. Tänk om.</p>
        <p class="press live">Tryck på valfri knapp för att börja</p>
      </div>

      <!-- Incheckning (spelarnamn) -->
      <CheckinScreen v-else-if="showLobby" @done="store.start()" />

      <!-- Motorn -->
      <StepStage v-else-if="store.started" />

      <!-- Klar -->
      <div v-else-if="store.finished" class="screen--attract">
        <h1 class="wordmark" style="font-size: 6.5cqw">Tack!</h1>
        <p class="tagline">
          {{ store.delta.andrade > 0 ? `${store.delta.andrade} av ${store.delta.jamforbara} tänkte om` : 'Ni stod fast' }}
        </p>
        <button class="gs-btn" @click="restart">Kör igen</button>
      </div>
    </StudioFrame>

    <MuteButton />
    <FacilitatorControls />
    <PilotPanel />
    <PauseOverlay v-if="store.paused" />
  </div>
</template>
