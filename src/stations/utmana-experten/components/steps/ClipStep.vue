<script setup lang="ts">
/** clip — verklighetsklipp med rubrik (Designförslag B-stil). Self-läge: klick = fortsätt. */
import { useUtmanaStore } from '../../store/utmanaStore'
import MediaSlot from '../../media/MediaSlot.vue'
import type { ClipStep } from '../../engine/types'

defineProps<{ step: ClipStep }>()
const store = useUtmanaStore()

function advance() {
  if (store.mode === 'self') store.next()
}
</script>

<template>
  <div class="screen--clip view" @click="advance">
    <h1 v-if="step.rubrik" class="clip__rubrik">{{ step.rubrik }}</h1>
    <div class="clip__slot">
      <MediaSlot :format="store.format?.id ?? ''" :content-id="step.contentId" />
    </div>
  </div>
</template>
