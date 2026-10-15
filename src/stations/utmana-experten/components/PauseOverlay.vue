<script setup lang="ts">
/** Helskärms paus-overlay (store.paused). Över allt utom facilitator-kontrollerna. */
import { useI18n } from '@/station-kit/i18n'
const { t } = useI18n()
</script>

<template>
  <div class="pause" role="status" aria-live="polite">
    <span class="pause__icon" aria-hidden="true">⏸</span>
    <span class="pause__title">{{ t('facil.paused_title') }}</span>
    <span class="pause__sub">{{ t('facil.paused_sub') }}</span>
  </div>
</template>

<style scoped>
.pause {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(3, 12, 8, 0.9);
  backdrop-filter: blur(2px);
}
.pause__icon {
  font-size: 4rem;
  color: var(--color-primary);
  text-shadow: 0 0 22px var(--color-primary);
  animation: pause-throb 1.6s ease-in-out infinite;
}
.pause__title {
  font-family: var(--font-retro);
  font-size: clamp(2.4rem, 7vw, 4rem);
  letter-spacing: 0.18em;
  color: var(--color-ink-strong);
}
.pause__sub {
  font-family: var(--font-retro);
  font-size: 1.3rem;
  color: var(--color-primary);
  text-align: center;
  max-width: 32rem;
  padding: 0 1rem;
}
@keyframes pause-throb {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .pause__icon { animation: none; }
}
</style>
