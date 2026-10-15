<script setup lang="ts">
/**
 * Bildupprendering (CRT render-in). Animerar in ALLA bilder på samma sätt —
 * ett skanlinje-svep uppifrån — med matchande render-ljud. Håll denna EN
 * konsekventa effekt för alla bilder i alla stationer.
 *
 * Respekterar prefers-reduced-motion (visar direkt, inget svep/ljud).
 */
import { ref, onMounted } from 'vue'
import { audio } from '../audio/AudioEngine'

withDefaults(
  defineProps<{
    src: string
    alt?: string
    sound?: boolean
  }>(),
  { alt: '', sound: true },
)

const rendered = ref(false)
const reduced =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  if (reduced) {
    rendered.value = true
    return
  }
  // Låt svep-animationen (CSS) köra; spela render-ljud i takt.
  requestAnimationFrame(() => {
    rendered.value = true
  })
})

function onStart(sound?: boolean) {
  if (!reduced && sound !== false) audio.play('render')
}
</script>

<template>
  <figure class="crt-image amber-frame" :class="{ 'crt-image--in': rendered }">
    <img :src="src" :alt="alt" @load="onStart(sound)" />
    <span class="crt-image__sweep" aria-hidden="true"></span>
  </figure>
</template>

<style scoped>
.crt-image {
  position: relative;
  margin: 0;
  overflow: hidden;
  display: block;
}
.crt-image img {
  display: block;
  width: 100%;
  height: auto;
  opacity: 0;
  filter: brightness(1.4) contrast(0.8);
  transition:
    opacity 0.5s ease,
    filter 0.5s ease;
}
.crt-image--in img {
  opacity: 1;
  filter: none;
}
/* Skanlinje-svep uppifrån. */
.crt-image__sweep {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 40%;
  background: linear-gradient(
    to bottom,
    rgba(255, 149, 0, 0) 0%,
    rgba(255, 149, 0, 0.25) 80%,
    rgba(255, 149, 0, 0.55) 100%
  );
  transform: translateY(-120%);
  opacity: 0;
}
.crt-image--in .crt-image__sweep {
  animation: crt-sweep 0.5s ease-out 1;
}
@keyframes crt-sweep {
  0% {
    transform: translateY(-120%);
    opacity: 1;
  }
  100% {
    transform: translateY(260%);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .crt-image img {
    opacity: 1;
    filter: none;
    transition: none;
  }
  .crt-image__sweep {
    display: none;
  }
}
</style>
