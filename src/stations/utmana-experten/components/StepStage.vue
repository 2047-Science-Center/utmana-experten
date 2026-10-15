<script setup lang="ts">
/** Mappar aktuell byggsten → rätt steg-komponent. Motorn är agnostisk; detta är
 *  bara vy-routingen. Lägg till en ny byggsten-typ = ny gren här + komponent. */
import { computed } from 'vue'
import { useUtmanaStore } from '../store/utmanaStore'
import { useI18n } from '@/station-kit/i18n'
import PresentStep from './steps/PresentStep.vue'
import VoteStep from './steps/VoteStep.vue'
import SpeakRoundStep from './steps/SpeakRoundStep.vue'
import AssessStep from './steps/AssessStep.vue'
import FacitStep from './steps/FacitStep.vue'
import FeedbackStep from './steps/FeedbackStep.vue'
import ClipStep from './steps/ClipStep.vue'
import RevealStep from './steps/RevealStep.vue'
import type { Step } from '../engine/types'

const store = useUtmanaStore()
const { t } = useI18n()

const COMPONENTS = {
  present: PresentStep,
  vote: VoteStep,
  speak_round: SpeakRoundStep,
  assess: AssessStep,
  facit: FacitStep,
  feedback: FeedbackStep,
  clip: ClipStep,
  reveal: RevealStep,
} as const

const step = computed<Step | null>(() => store.current)
const comp = computed(() => (step.value ? COMPONENTS[step.value.typ] : null))
</script>

<template>
  <div class="stage-wrap">
    <component :is="comp" v-if="comp && step" :key="store.stepIndex" :step="step" />
    <!-- gm: steget klart, väntar på spelledaren -->
    <div v-if="store.awaitingNext" class="awaiting">{{ t('studio.waiting_gm') }}</div>
  </div>
</template>

<style scoped>
.stage-wrap {
  position: relative;
  height: 100%;
}
.awaiting {
  position: absolute;
  bottom: 0.6rem;
  left: 0;
  right: 0;
  text-align: center;
  color: var(--color-ink-muted);
  letter-spacing: 0.15em;
}
</style>
