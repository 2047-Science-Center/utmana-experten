<script setup lang="ts">
/**
 * Gemensam attract/boot-skärm — SAMMA i alla fyra stationer, visas innan
 * inloggning. Första användargesten låser upp ljudkontexten (kiosk-autoplay)
 * och spelar boot-sekvensen.
 */
import { ref } from 'vue'
import { audio } from '../audio/AudioEngine'
import { useI18n } from '../i18n'
import Teletype from './Teletype.vue'

const emit = defineEmits<{ start: [] }>()
const { t } = useI18n()
const booting = ref(false)

function begin() {
  if (booting.value) return
  booting.value = true
  audio.unlock()
  audio.play('boot')
  // Kort boot-känsla innan vi går vidare.
  setTimeout(() => emit('start'), 900)
}
</script>

<template>
  <div class="attract" @click="begin">
    <div class="attract__logo">
      <h1 class="attract__title ink-strong">{{ t('app.title') }}</h1>
      <p class="attract__sub">{{ t('app.subtitle') }}</p>
    </div>

    <Teletype
      class="attract__tag"
      :text="t('attract.tagline')"
      :speed="30"
    />

    <p v-if="!booting" class="attract__cta crt-caret">
      {{ t('common.press_to_start') }}
    </p>
    <p v-else class="attract__cta">{{ t('attract.boot') }}</p>
  </div>
</template>

<style scoped>
.attract {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  height: 100%;
  text-align: center;
  cursor: pointer;
}
.attract__title {
  font-size: clamp(3rem, 10vw, 7rem);
  margin: 0;
  letter-spacing: 0.1em;
}
.attract__sub {
  color: var(--color-primary);
  font-size: 1.4rem;
  margin: 0.3rem 0 0;
  letter-spacing: 0.3em;
}
.attract__tag {
  max-width: 40ch;
  color: var(--color-primary);
}
.attract__cta {
  font-size: 1.6rem;
  color: var(--color-ink-strong);
  letter-spacing: 0.1em;
}
</style>
