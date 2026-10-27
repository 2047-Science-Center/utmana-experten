<script setup lang="ts">
/**
 * Roten för Utmana experten (Designförslag B — "Marquee-skärm"). Studio-skalet
 * (marquee + HUD) omsluter aktuell vy: attract → steg-motorn → klar. Motorn
 * (store) är oförändrad; detta är vyerna. Facilitator/pilot-panel/mute ligger
 * som fixed-overlays utanför scenen så de aldrig klipps.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { audio } from '@/station-kit/audio/AudioEngine'
import { useUtmanaStore } from './store/utmanaStore'
import { DEFAULT_FORMAT_ID } from './formats'
import StudioFrame from './components/StudioFrame.vue'
import StepStage from './components/StepStage.vue'
import FormatSelect from './components/FormatSelect.vue'
import CheckinScreen from './components/CheckinScreen.vue'
import MuteButton from '@/station-kit/components/MuteButton.vue'
import FacilitatorControls from './components/FacilitatorControls.vue'
import PauseOverlay from './components/PauseOverlay.vue'
import SpelledarePanel from './components/SpelledarePanel.vue'

const store = useUtmanaStore()
const booted = ref(false)
const picked = ref(false) // format valt i väljaren → vidare till incheckning

/** Attract-vyn visas (för-start) → spela attract-bädden. */
const onAttract = computed(() => !booted.value && !store.started && !store.finished)

onMounted(() => {
  store.init()
  if (!store.format) store.selectFormat(DEFAULT_FORMAT_ID)
  // Kiosk-Chrome kör med --autoplay-policy=no-user-gesture-required → bädden
  // kan starta direkt; i vanlig webbläsare startar den vid första gesten.
  audio.unlock()
  if (onAttract.value) audio.playLoop('attract-loop')
})
// Starta/stoppa attract-bädden när vi går in i / lämnar attract.
watch(onAttract, (v) => (v ? audio.playLoop('attract-loop') : audio.stopLoop('attract-loop')))

function onAttractStart() {
  booted.value = true
  audio.unlock()
  audio.stopLoop('attract-loop')
  audio.play('boot')
  // Går till format-väljaren; därefter incheckning (namn) → omgång.
}
function onPick(id: string) {
  store.selectFormat(id)
  picked.value = true
  audio.play('confirm')
}
function restart() {
  store.reset()
  booted.value = false
  picked.value = false
}

const showPick = computed(() => booted.value && !picked.value && !store.started && !store.finished)
const showLobby = computed(() => booted.value && picked.value && !store.started && !store.finished)
</script>

<template>
  <div>
    <StudioFrame :show-hud="booted || store.started">
      <!-- Attract (döljs även när spelledaren/Blocks startar via gm/start) -->
      <div v-if="!booted && !store.started && !store.finished" class="screen--attract" @click="onAttractStart">
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

      <!-- Format-val (alla 7; bara byggda går att klicka) -->
      <FormatSelect v-else-if="showPick" @pick="onPick" />

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
    <SpelledarePanel />
    <PauseOverlay v-if="store.paused" />
  </div>
</template>
