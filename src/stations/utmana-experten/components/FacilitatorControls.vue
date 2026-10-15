<script setup lang="ts">
/**
 * Diskret facilitator-kontroll nere till vänster — finns i BÅDE pilot och drift.
 * Paus (fryser tänk-turen), Starta om, Avsluta (stänger kiosk-fönstret). Ligger
 * ovanför paus-overlayen (z 300 > 200) så pausen alltid kan hävas.
 */
import { ref } from 'vue'
import { useUtmanaStore } from '../store/utmanaStore'
import { useI18n } from '@/station-kit/i18n'

const store = useUtmanaStore()
const { t } = useI18n()
const confirm = ref<'' | 'reset' | 'exit'>('')

function doReset() {
  confirm.value = ''
  store.reset()
}
function doExit() {
  confirm.value = ''
  store.quitStation()
}
</script>

<template>
  <div class="facil">
    <div v-if="confirm === 'reset'" class="facil__confirm">
      <span class="facil__confirm-q">{{ t('facil.reset_confirm') }}</span>
      <div class="facil__confirm-row">
        <button class="crt-button crt-button--danger facil__btn" @click="doReset">{{ t('facil.reset_yes') }}</button>
        <button class="crt-button facil__btn" @click="confirm = ''">{{ t('facil.cancel') }}</button>
      </div>
    </div>
    <div v-else-if="confirm === 'exit'" class="facil__confirm">
      <span class="facil__confirm-q">{{ t('facil.exit_confirm') }}</span>
      <div class="facil__confirm-row">
        <button class="crt-button crt-button--danger facil__btn" @click="doExit">{{ t('facil.exit_yes') }}</button>
        <button class="crt-button facil__btn" @click="confirm = ''">{{ t('facil.cancel') }}</button>
      </div>
    </div>
    <div v-else class="facil__row">
      <button
        v-if="store.started"
        class="crt-button facil__btn facil__next"
        @click="store.next()"
      >
        ▸ Nästa
      </button>
      <button
        class="crt-button facil__btn"
        :class="{ 'crt-button--strong': store.paused }"
        @click="store.togglePause()"
      >
        {{ store.paused ? '▶ ' + t('facil.resume') : '⏸ ' + t('facil.pause') }}
      </button>
      <button class="crt-button facil__btn facil__reset" @click="confirm = 'reset'">⟲ {{ t('facil.reset') }}</button>
      <button class="crt-button facil__btn facil__reset" @click="confirm = 'exit'">✕ {{ t('facil.exit') }}</button>
    </div>
  </div>
</template>

<style scoped>
.facil {
  position: fixed;
  left: 0.75rem;
  bottom: 0.75rem;
  z-index: 300;
  font-family: var(--font-retro);
}
.facil__row,
.facil__confirm-row {
  display: flex;
  gap: 0.4rem;
}
.facil__confirm {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: var(--color-background-2, #0a0a0a);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 0.6rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}
.facil__confirm-q {
  color: var(--color-ink-strong);
  font-size: 0.95rem;
}
.facil__btn {
  font-size: 0.9rem;
  padding: 0.25em 0.7em;
  opacity: 0.82;
}
.facil__btn:hover {
  opacity: 1;
}
.facil__reset {
  color: var(--color-ink-muted);
  border-color: var(--color-primary-dim);
}
.facil__next {
  opacity: 1;
  color: var(--color-ink-strong);
  border-color: var(--color-primary);
  font-weight: 700;
}
</style>
