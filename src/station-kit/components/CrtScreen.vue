<script setup lang="ts">
/**
 * Grundskärmen — den glödande bärnstensramen + CRT-chrome (skanlinjer,
 * flimmer, vinjett). SER LIKADAN UT i alla fyra X&Y-stationer. Innehållet
 * kommer via default-slot.
 */
withDefaults(defineProps<{ flicker?: boolean }>(), { flicker: true })
</script>

<template>
  <div
    class="crt-screen crt-frame crt-scanlines"
    :class="{ 'crt-flicker': flicker }"
  >
    <div class="crt-screen__inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.crt-screen {
  width: 100%;
  height: 100%;
  min-height: 0;
}
.crt-screen__inner {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: clamp(1rem, 3vh, 2rem);
  overflow: auto;
}
</style>
