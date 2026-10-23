<script setup lang="ts">
/** Format-väljaren — visas efter attract, före incheckning. Alla sju format
 *  ligger som kort; bara de byggda (byggd:true) går att klicka, resten är
 *  låsta ("Kommer snart"). Val → emit pick(id); UtmanaApp väljer formatet och
 *  går vidare till incheckning. Marquee-temat (gameshow.css-tokens). */
import { computed } from 'vue'
import { FORMATS } from '../formats'
import { slotsOf } from '../engine/voteSlots'
import type { FormatDef } from '../engine/types'

const emit = defineEmits<{ pick: [id: string] }>()

const cards = computed(() => FORMATS)

function dots(f: FormatDef): string[] {
  return slotsOf(f).map((s) => s.color)
}
function choose(f: FormatDef) {
  if (f.byggd) emit('pick', f.id)
}
</script>

<template>
  <div class="screen--pick view">
    <h1 class="pick__title">Välj spelform</h1>
    <p class="pick__hint">Två är redo att spela. Fler är på väg.</p>
    <div class="pick__grid">
      <button
        v-for="f in cards"
        :key="f.id"
        class="pcard"
        :class="{ 'pcard--locked': !f.byggd }"
        :disabled="!f.byggd"
        @click="choose(f)"
      >
        <span class="pcard__dots">
          <i v-for="(c, i) in dots(f)" :key="i" :style="{ background: f.byggd ? c : 'var(--creme-dim)' }"></i>
        </span>
        <span class="pcard__name">{{ f.namn }}</span>
        <span class="pcard__desc">{{ f.beskrivning }}</span>
        <span v-if="f.byggd" class="pcard__go">Spela ▸</span>
        <span v-else class="pcard__lock">🔒 Kommer snart</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.screen--pick {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6cqw;
  padding: 4cqw 5cqw;
}
.pick__title {
  font-family: var(--f-disp);
  font-weight: 800;
  font-size: 4.6cqw;
  color: var(--creme);
  margin: 0;
}
.pick__hint {
  font-family: var(--f-text);
  font-size: 1.7cqw;
  color: var(--creme-dim);
  margin: 0 0 1.4cqw;
}
.pick__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.6cqw;
  width: 100%;
  max-width: 86cqw;
}
.pcard {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5cqw;
  text-align: left;
  padding: 1.6cqw 1.6cqw 1.3cqw;
  min-height: 11cqw;
  background: var(--panel);
  border: 0.22cqw solid var(--birch);
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}
.pcard:not(.pcard--locked):hover {
  transform: translateY(-0.4cqw);
  border-color: var(--orange);
  box-shadow: 0 0.8cqw 2cqw rgba(0, 0, 0, 0.3);
}
.pcard--locked {
  opacity: 0.44;
  cursor: not-allowed;
  border-style: dashed;
}
.pcard__dots {
  display: inline-flex;
  gap: 0.5cqw;
}
.pcard__dots i {
  width: 1.1cqw;
  height: 1.1cqw;
  border-radius: 50%;
  display: inline-block;
}
.pcard__name {
  font-family: var(--f-disp);
  font-weight: 700;
  font-size: 2.3cqw;
  color: var(--creme);
}
.pcard__desc {
  font-family: var(--f-text);
  font-size: 1.5cqw;
  line-height: 1.3;
  color: var(--creme-dim);
  flex: 1;
}
.pcard__go {
  font-family: var(--f-disp);
  font-weight: 700;
  font-size: 1.6cqw;
  color: var(--orange);
}
.pcard__lock {
  font-family: var(--f-text);
  font-weight: 600;
  font-size: 1.4cqw;
  letter-spacing: 0.04em;
  color: var(--birch-lt);
}
</style>
