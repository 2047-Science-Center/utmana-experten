<script setup lang="ts">
/**
 * Placeholder-först media. Finns en `file` i manifestet renderas video/bild;
 * annars en streckad ruta med briefen. Layouten är klar — media droppas in sen
 * utan kodändring. Mönster från Minnestestet.
 */
import { computed } from 'vue'
import { media } from './manifest'

const props = withDefaults(
  defineProps<{
    format: string
    contentId: string
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
  }>(),
  { autoplay: true, loop: false, muted: true },
)

const emit = defineEmits<{ ended: [] }>()

const m = computed(() => media(props.format, props.contentId))
const isVideo = computed(() => m.value.typ !== 'image')
const ratio = computed(() => (m.value.aspect === '1:1' ? '1 / 1' : m.value.aspect === '9:16' ? '9 / 16' : '16 / 9'))
const label = computed(() => {
  const k = m.value.typ === 'image' ? 'BILD' : m.value.typ === 'video-loop' ? 'VIDEO (loop)' : 'VIDEO'
  return `[${k}: ${props.contentId}]`
})
</script>

<template>
  <div class="slot" :style="{ aspectRatio: ratio }">
    <video
      v-if="m.src && isVideo"
      :src="m.src"
      :autoplay="autoplay"
      :loop="loop || m.typ === 'video-loop'"
      :muted="muted"
      playsinline
      class="slot__media"
      @ended="emit('ended')"
    />
    <img v-else-if="m.src" :src="m.src" class="slot__media" alt="" />
    <div v-else class="slot__ph">
      <div class="slot__label">{{ label }}</div>
      <div class="slot__brief">{{ m.brief }}</div>
    </div>
  </div>
</template>

<style scoped>
.slot {
  width: 100%;
  max-height: 100%;
  max-width: min(100%, 72vh);
  margin: 0 auto;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--color-background-2);
}
.slot__media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.slot__ph {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.2rem;
  box-sizing: border-box;
  border: 2px dashed var(--color-primary-dim);
  border-radius: var(--radius);
  text-align: center;
}
.slot__label {
  font-family: var(--font-retro);
  color: var(--color-primary);
  font-size: 1.3rem;
  letter-spacing: 0.1em;
}
.slot__brief {
  color: var(--color-ink-muted);
  font-size: 0.95rem;
  max-width: 48ch;
}
</style>
