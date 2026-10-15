<script setup lang="ts">
/** present — frågan överst/centralt (Designförslag B). Chips i knappordning
 *  NEJ·KANSKE·JA. I self-läge: klick var som helst = fortsätt (fysisk knapp i drift). */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import type { PresentStep } from '../../engine/types'

const props = defineProps<{ step: PresentStep }>()
const store = useUtmanaStore()

const fraga = computed(() => store.format?.fraga ?? '')
const irl = computed(() => props.step.source === 'irl')

function advance() {
  if (store.mode === 'self') store.next()
}
</script>

<template>
  <div class="screen--fraga view" @click="advance">
    <template v-if="irl">
      <p class="fraga__num">Titta upp</p>
      <h1 class="fraga__q">{{ fraga }}</h1>
    </template>
    <template v-else>
      <div class="fraga__num">{{ store.format?.namn }}</div>
      <h1 class="fraga__q">{{ fraga }}</h1>
      <div class="stance">
        <span class="chip nej">NEJ</span>
        <span class="chip kanske">KANSKE</span>
        <span class="chip ja">JA</span>
      </div>
      <p class="fraga__hint">Svara på knapparna vid din plats</p>
    </template>
  </div>
</template>
