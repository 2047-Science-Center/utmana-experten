<script setup lang="ts">
/** facit — rätt svar stort (Designförslag B) + samma tredjedel tänds på ALLA
 *  platser i hästskon (= LED-stripens facit-signal). Self-läge: klick = fortsätt. */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import Horseshoe from '../Horseshoe.vue'
import type { FacitStep } from '../../engine/types'

defineProps<{ step: FacitStep }>()
const store = useUtmanaStore()

const ratt = computed(() => store.facitRatt ?? '')
const rattLabel = computed(() => ratt.value.toUpperCase())

function advance() {
  if (store.mode === 'self') store.next()
}
</script>

<template>
  <div class="screen--facit view" @click="advance">
    <div class="verdict">
      <p class="verdict__eyebrow">Expertens svar</p>
      <p class="verdict__answer" :class="ratt">{{ rattLabel }}</p>
      <p class="verdict__body">
        <span class="lead">Så här ligger det till.</span> Experten förklarar varför — och
        verkligheten är sällan ett rakt ja eller nej.
      </p>
    </div>
    <div class="stage">
      <Horseshoe :show-facit="true" tv="Rätt svar" />
    </div>
  </div>
</template>
