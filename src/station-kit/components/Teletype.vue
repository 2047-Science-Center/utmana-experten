<script setup lang="ts">
/**
 * Framskriven text (teletype): skriver ut tecken för tecken med retro-blip.
 * Tryck för att hoppa över (visa hela direkt).
 *
 * OBS: BARA berättande/instruerande text framskrivs. Levande värden (kapital,
 * timer, poäng) uppdateras direkt utan att skrivas om — använd inte denna för
 * sådant.
 */
import { ref, watch, onUnmounted } from 'vue'
import { audio } from '../audio/AudioEngine'

const props = withDefaults(
  defineProps<{
    text: string
    /** ms per tecken */
    speed?: number
    /** blip-ljud per tecken */
    sound?: boolean
  }>(),
  { speed: 26, sound: true },
)

const emit = defineEmits<{ done: [] }>()

const shown = ref('')
const done = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let i = 0

function clear() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function finish() {
  clear()
  shown.value = props.text
  i = props.text.length
  if (!done.value) {
    done.value = true
    emit('done')
  }
}

function step() {
  if (i >= props.text.length) {
    done.value = true
    emit('done')
    return
  }
  const ch = props.text[i]
  shown.value += ch
  i += 1
  if (props.sound && ch.trim()) audio.play('blip')
  timer = setTimeout(step, props.speed)
}

function start() {
  clear()
  shown.value = ''
  i = 0
  done.value = false
  step()
}

/** Tryck för att hoppa över. */
function skip() {
  if (!done.value) finish()
}

watch(() => props.text, start, { immediate: true })
onUnmounted(clear)

defineExpose({ skip, finish })
</script>

<template>
  <p class="teletype" @click="skip">
    <span>{{ shown }}</span
    ><span v-if="!done" class="crt-caret" aria-hidden="true">▋</span>
  </p>
</template>

<style scoped>
.teletype {
  font-family: var(--font-retro);
  font-size: 1.5rem;
  line-height: 1.4;
  margin: 0;
  cursor: pointer;
  min-height: 1.4em;
}
.crt-caret {
  color: var(--color-primary);
}
</style>
