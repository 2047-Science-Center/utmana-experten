<script setup lang="ts">
/** gate — "Är du redo?" mellan motivering och klipp. SELF: alla trycker GRÖNT
 *  (ja-knappen) → när alla platser tryckt kör motorn vidare. GM: spelledaren
 *  gatar (NÄSTA ▸). Ingen auto-nästa i self — det är gruppen som släpper. */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import type { GateStep } from '../../engine/types'

const props = defineProps<{ step: GateStep }>()
const store = useUtmanaStore()

const rubrik = computed(() => props.step.rubrik ?? 'Är du redo?')
const text = computed(() => props.step.text ?? '')
const ready = computed(() => store.readySeats)
const allReady = computed(() => store.seats.every((s) => ready.value.includes(s)))
</script>

<template>
  <div class="screen--gate view">
    <h1 class="gate__rubrik">{{ rubrik }}</h1>
    <p v-if="text" class="gate__text">{{ text }}</p>

    <!-- SELF: alla trycker grönt -->
    <template v-if="store.mode === 'self'">
      <div class="gate__seats">
        <span
          v-for="n in store.seats"
          :key="n"
          class="gate__seat"
          :class="{ 'is-ready': ready.includes(n) }"
        >
          {{ store.displayName(n) }}
        </span>
      </div>
      <p class="gate__cta" :class="{ 'is-done': allReady }">
        <span class="gate__dot"></span>
        {{ allReady ? 'Alla redo!' : 'Tryck på den gröna knappen när du är redo' }}
        <span v-if="!allReady" class="gate__count">{{ ready.length }} / {{ store.seats.length }}</span>
      </p>
    </template>

    <!-- GM: spelledaren släpper vidare -->
    <template v-else>
      <p class="gate__cta"><span class="gate__dot gate__dot--gm"></span>Spelledaren släpper vidare</p>
    </template>
  </div>
</template>

<style scoped>
.screen--gate {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.6cqw;
  padding: 6cqw;
  text-align: center;
}
.gate__rubrik {
  font-family: var(--f-disp);
  font-weight: 800;
  font-size: 7cqw;
  line-height: 1;
  color: var(--creme);
  margin: 0;
}
.gate__text {
  font-family: var(--f-text);
  font-size: 2.4cqw;
  color: var(--creme-dim);
  max-width: 44ch;
  margin: 0;
}
.gate__seats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1cqw;
  margin-top: 1cqw;
}
.gate__seat {
  font-family: var(--f-disp);
  font-weight: 700;
  font-size: 1.8cqw;
  padding: 0.5em 1em;
  border-radius: 999px;
  color: var(--creme-dim);
  background: var(--panel);
  border: 0.22cqw solid var(--birch);
  transition: all 0.2s ease;
}
.gate__seat.is-ready {
  color: var(--petrol);
  background: var(--ja, #36b34a);
  border-color: var(--ja, #36b34a);
  transform: translateY(-0.3cqw);
}
.gate__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  font-family: var(--f-disp);
  font-weight: 700;
  font-size: 2.4cqw;
  color: var(--creme);
  margin: 0.6cqw 0 0;
}
.gate__cta.is-done {
  color: var(--ja, #36b34a);
}
.gate__count {
  font-size: 1.8cqw;
  color: var(--birch-lt);
}
.gate__dot {
  width: 1.6cqw;
  height: 1.6cqw;
  border-radius: 50%;
  background: var(--ja, #36b34a);
  box-shadow: 0 0 2cqw var(--ja, #36b34a);
  animation: gatePulse 1.1s ease-in-out infinite;
}
.gate__dot--gm {
  background: var(--orange, #d4682e);
  box-shadow: 0 0 2cqw var(--orange, #d4682e);
}
@keyframes gatePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
@media (prefers-reduced-motion: reduce) {
  .gate__dot { animation: none; }
}
</style>
