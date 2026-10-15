<script setup lang="ts">
/**
 * Studio-skalet (Designförslag B): helskärms marquee-ram med jagande lampor,
 * en 16:9-scenyta (container-type: cqw-skalning) och HUD:en — varumärket i ett
 * hörn, stegetiketten i det andra. Innehållet (aktuell vy) ligger i default-slot.
 */
import { computed } from 'vue'
import { useUtmanaStore } from '../store/utmanaStore'
import { GAME_BRAND } from '@/config'

const store = useUtmanaStore()

const props = withDefaults(defineProps<{ showHud?: boolean }>(), { showHud: true })

const STEP_LABEL: Record<string, string> = {
  present: 'Fråga',
  speak_round: 'Motivering',
  assess: 'Expertens dom',
  facit: 'Facit',
  feedback: 'Återkoppling',
  clip: 'Verkligheten',
  reveal: 'Före → efter',
}

const stepLabel = computed(() => {
  const s = store.current
  if (!s) return ''
  if (s.typ === 'vote') {
    const mp = store.currentMatpunkt
    return mp === 'efter' ? 'Röstning · efter' : mp === 'fore' ? 'Röstning · före' : 'Röstning'
  }
  return STEP_LABEL[s.typ] ?? ''
})

const hud = computed(() => props.showHud && store.started)
</script>

<template>
  <div class="studio">
    <div class="studio__screen">
      <div v-if="hud" class="hud">
        <span class="brand">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="58" r="26" fill="#d4682e" />
            <ellipse cx="60" cy="60" rx="48" ry="15" fill="none" stroke="#c89b5e" stroke-width="5" transform="rotate(-18 60 60)" />
          </svg>
          {{ GAME_BRAND }}
        </span>
        <span v-if="stepLabel" class="step">{{ stepLabel }}</span>
      </div>
      <slot />
    </div>
    <span class="lamps t"></span><span class="lamps b"></span><span class="lamps l"></span><span class="lamps r"></span>
  </div>
</template>
