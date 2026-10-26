<script setup lang="ts">
/** vote — hästskon tänds i röstfärg per plats (Designförslag B). Inga knappar
 *  på skärmen (de sitter på borden); legend + påminnelse nederst. Variant-format
 *  (Ändra dig): variantens titel stort + frågan som ingress (samma hierarki som
 *  present). Annars: bara frågan. */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import Horseshoe from '../Horseshoe.vue'
import { slotsOf } from '../../engine/voteSlots'
import type { VoteStep } from '../../engine/types'

defineProps<{ step: VoteStep }>()
const store = useUtmanaStore()

const variant = computed(() => store.activeVariant)
const title = computed(() => variant.value?.titel ?? store.format?.namn ?? '')
const fraga = computed(() => store.format?.fraga ?? '')
const slots = computed(() => slotsOf(store.format))
</script>

<template>
  <div class="screen--scene view">
    <header class="vote-head">
      <template v-if="variant">
        <h1 class="vote-head__title">{{ title }}</h1>
        <p v-if="fraga" class="vote-head__q">{{ fraga }}</p>
      </template>
      <h2 v-else class="mini-q">{{ fraga }}</h2>
    </header>
    <div class="stage">
      <Horseshoe :tv="title" />
    </div>
    <div class="legend">
      <span v-for="slot in slots" :key="slot.id"><i :style="{ background: slot.color }"></i>{{ slot.label }}</span>
      <span class="hint">Knapparna sitter på borden — inte på skärmen</span>
    </div>
  </div>
</template>

<style scoped>
.vote-head {
  text-align: center;
}
.vote-head__title {
  font-family: var(--f-disp);
  font-weight: 800;
  font-size: 4.4cqw;
  line-height: 1.02;
  color: var(--creme);
  margin: 0;
}
.vote-head__q {
  font-family: var(--f-text);
  font-size: 1.9cqw;
  line-height: 1.3;
  color: var(--creme-dim);
  margin: 0.5cqw auto 0;
  max-width: 48ch;
}
</style>
