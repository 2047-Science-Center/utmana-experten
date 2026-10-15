<script setup lang="ts">
/** vote — hästskon tänds i röstfärg per plats (Designförslag B). Inga knappar
 *  på skärmen (de sitter på borden); legend + påminnelse nederst. */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import Horseshoe from '../Horseshoe.vue'
import type { VoteStep } from '../../engine/types'

defineProps<{ step: VoteStep }>()
const store = useUtmanaStore()

const fraga = computed(() => store.format?.fraga ?? '')
</script>

<template>
  <div class="screen--scene view">
    <h2 class="mini-q">{{ fraga }}</h2>
    <div class="stage">
      <Horseshoe />
    </div>
    <div class="legend">
      <span><i style="background: var(--nej)"></i>Nej</span>
      <span><i style="background: var(--kanske)"></i>Kanske</span>
      <span><i style="background: var(--ja)"></i>Ja</span>
      <span class="hint">Knapparna sitter på borden — inte på skärmen</span>
    </div>
  </div>
</template>
