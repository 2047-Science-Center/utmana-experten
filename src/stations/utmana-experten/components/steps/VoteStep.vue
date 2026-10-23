<script setup lang="ts">
/** vote — hästskon tänds i röstfärg per plats (Designförslag B). Inga knappar
 *  på skärmen (de sitter på borden); legend + påminnelse nederst. Legenden
 *  speglar formatets slottar: ja/nej/kanske ELLER namngivna alternativ. */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import Horseshoe from '../Horseshoe.vue'
import { slotsOf } from '../../engine/voteSlots'
import type { VoteStep } from '../../engine/types'

defineProps<{ step: VoteStep }>()
const store = useUtmanaStore()

const fraga = computed(() => store.format?.fraga ?? '')
const slots = computed(() => slotsOf(store.format))
</script>

<template>
  <div class="screen--scene view">
    <h2 class="mini-q">{{ fraga }}</h2>
    <div class="stage">
      <Horseshoe />
    </div>
    <div class="legend">
      <span v-for="slot in slots" :key="slot.id"><i :style="{ background: slot.color }"></i>{{ slot.label }}</span>
      <span class="hint">Knapparna sitter på borden — inte på skärmen</span>
    </div>
  </div>
</template>
