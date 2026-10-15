<script setup lang="ts">
/**
 * Steg-controllerns skal (§5): "en sak i taget". Ger progress-prickar, ett
 * stort framåt-steg (KLAR ▸ / NÄSTA ▸ / KÖR LIVE ▸) som tänds FÖRST när
 * momentet är gjort (canAdvance), och en diskret hoppa-över. Självtempo.
 * Innehållet (stage) kommer via default-slot; att dämpa allt utom aktivt
 * element är stegets eget ansvar.
 */
import { useI18n } from '../i18n'

withDefaults(
  defineProps<{
    stepIndex: number
    stepCount: number
    canAdvance: boolean
    forwardKey?: string
    showSkip?: boolean
  }>(),
  { forwardKey: 'onboarding.next', showSkip: false },
)

const emit = defineEmits<{ advance: []; skip: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="shell">
    <div class="shell__top">
      <div class="shell__dots" role="list">
        <span
          v-for="n in stepCount"
          :key="n"
          class="shell__dot"
          :class="{ 'shell__dot--done': n - 1 < stepIndex, 'shell__dot--now': n - 1 === stepIndex }"
        />
      </div>
      <button v-if="showSkip" class="shell__skip" @click="emit('skip')">
        {{ t('onboarding.skip') }}
      </button>
    </div>

    <div class="shell__stage">
      <slot />
    </div>

    <div class="shell__foot">
      <button
        class="crt-button crt-button--strong shell__forward"
        :disabled="!canAdvance"
        @click="emit('advance')"
      >
        {{ t(forwardKey) }} ▸
      </button>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}
.shell__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.shell__dots {
  display: flex;
  gap: 0.5rem;
}
.shell__dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  border: 1px solid var(--color-primary-dim);
}
.shell__dot--done {
  background: var(--color-primary-dim);
}
.shell__dot--now {
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary);
}
.shell__skip {
  font-family: var(--font-retro);
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  background: transparent;
  border: 1px solid var(--color-primary-dim);
  border-radius: 6px;
  padding: 0.2em 0.7em;
  cursor: pointer;
}
.shell__skip:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.shell__stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.shell__foot {
  display: flex;
  justify-content: center;
}
.shell__forward {
  font-size: 1.5rem;
  padding: 0.5em 2em;
}
</style>
