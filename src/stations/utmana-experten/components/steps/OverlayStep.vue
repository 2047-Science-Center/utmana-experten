<script setup lang="ts">
/** overlay — ett kort mellanspel som animeras in (t.ex. "Vill du ändra dig?"
 *  efter klippet). Presentationssteg: self auto-stegar efter dwell, gm gatar.
 *  Klick = fortsätt i self. StepStage korsfadar till nästa vy när den lämnar. */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import type { OverlayStep } from '../../engine/types'

const props = defineProps<{ step: OverlayStep }>()
const store = useUtmanaStore()

const rubrik = computed(() => props.step.rubrik ?? '')
const text = computed(() => props.step.text ?? '')

function advance() {
  if (store.mode === 'self') store.next()
}
</script>

<template>
  <div class="screen--overlay view" @click="advance">
    <div class="ov__card">
      <svg class="ov__spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill="currentColor" /></svg>
      <p v-if="text" class="ov__text">{{ text }}</p>
      <h1 class="ov__rubrik">{{ rubrik }}</h1>
    </div>
  </div>
</template>

<style scoped>
.screen--overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6cqw;
}
.ov__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1cqw;
  padding: 5cqw 6cqw;
  text-align: center;
  background: radial-gradient(120% 120% at 50% 0%, rgba(242, 231, 207, 0.08), transparent 70%), var(--panel);
  border: 0.22cqw solid var(--birch);
  border-radius: 28px;
  box-shadow: 0 2cqw 6cqw rgba(0, 0, 0, 0.45);
  animation: ovIn 0.55s cubic-bezier(0.2, 0.9, 0.25, 1) both;
}
.ov__spark {
  width: 4cqw;
  height: 4cqw;
  color: var(--orange, #d4682e);
  animation: ovSpark 0.7s ease-out 0.2s both;
}
.ov__text {
  font-family: var(--f-text);
  font-size: 2.1cqw;
  color: var(--creme-dim);
  max-width: 40ch;
  margin: 0;
  animation: ovUp 0.5s ease-out 0.15s both;
}
.ov__rubrik {
  font-family: var(--f-disp);
  font-weight: 800;
  font-size: 6cqw;
  line-height: 1.02;
  color: var(--creme);
  margin: 0;
  animation: ovUp 0.5s ease-out 0.28s both;
}
@keyframes ovIn {
  from { opacity: 0; transform: scale(0.88) translateY(2cqw); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes ovUp {
  from { opacity: 0; transform: translateY(1.4cqw); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ovSpark {
  from { opacity: 0; transform: scale(0) rotate(-40deg); }
  to { opacity: 1; transform: scale(1) rotate(0); }
}
@media (prefers-reduced-motion: reduce) {
  .ov__card, .ov__spark, .ov__text, .ov__rubrik { animation: none; }
}
</style>
