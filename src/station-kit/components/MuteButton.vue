<script setup lang="ts">
/** Global mute-knapp. Läser/skriver ljudmotorns tillstånd. */
import { ref } from 'vue'
import { audio } from '../audio/AudioEngine'
import { useI18n } from '../i18n'

const { t } = useI18n()
const muted = ref(audio.muted)

function toggle() {
  muted.value = audio.toggleMuted()
}
</script>

<template>
  <button
    class="crt-button mute-button"
    :aria-pressed="muted"
    :title="muted ? t('common.unmute') : t('common.mute')"
    @click="toggle"
  >
    {{ muted ? '🔇' : '🔊' }}
  </button>
</template>

<style scoped>
.mute-button {
  font-size: 1.1rem;
  padding: 0.2em 0.5em;
}
</style>
