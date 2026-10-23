<script setup lang="ts">
/** clip — verklighetsklipp med rubrik (Designförslag B-stil). Self-läge: klick = fortsätt.
 *  Variant-format (Ändra dig): klippet hämtas på den valda variantens id. */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import MediaSlot from '../../media/MediaSlot.vue'
import type { ClipStep } from '../../engine/types'

const props = defineProps<{ step: ClipStep }>()
const store = useUtmanaStore()

/** Media-nyckel: variantens id om formatet har varianter, annars stegets contentId. */
const contentId = computed(() => store.activeVariant?.id ?? props.step.contentId)

function advance() {
  if (store.mode === 'self') store.next()
}
</script>

<template>
  <div class="screen--clip view" @click="advance">
    <h1 v-if="step.rubrik" class="clip__rubrik">{{ step.rubrik }}</h1>
    <div class="clip__slot">
      <MediaSlot :format="store.format?.id ?? ''" :content-id="contentId" />
    </div>
  </div>
</template>
