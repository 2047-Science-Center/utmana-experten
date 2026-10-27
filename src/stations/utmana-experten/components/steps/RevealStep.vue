<script setup lang="ts">
/** reveal — före→efter-glappet (Designförslag B): stort delta + fördelnings-
 *  staplar + ljus-svep. Self-läge: klick = fortsätt (avslutar rundan). */
import { computed, onMounted } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import { audio } from '@/station-kit/audio/AudioEngine'
import { slotsOf } from '../../engine/voteSlots'

const store = useUtmanaStore()

/** Fördelningsstaplarna följer formatets slottar (ja/nej/kanske el. namngivna
 *  alternativ) i knappordning, med positionsfärg. */
const SLOTS = computed(() => slotsOf(store.format))
/** Namngivna alternativ är längre än JA/NEJ → bredare etikettkolumn. */
const named = computed(() => Boolean(store.format?.alternativ?.length))

const d = computed(() => store.delta)

// Payoff-sting efter pre-reveal-risern (som spelas i storen vid reveal-inträde):
// "X tänkte om" vs "ni stod fast".
onMounted(() => {
  window.setTimeout(() => audio.play(d.value.andrade > 0 ? 'utfall-tankte-om' : 'utfall-stod-fast'), 850)
})
const maxN = computed(() => {
  const all = [...Object.values(d.value.fore), ...Object.values(d.value.efter), 1]
  return Math.max(...all)
})
function rows(tally: Record<string, number>) {
  return SLOTS.value.map((s) => ({
    id: s.id,
    label: s.label.toUpperCase(),
    color: s.color,
    n: tally[s.id] ?? 0,
    pct: Math.round(((tally[s.id] ?? 0) / maxN.value) * 100),
  }))
}
const foreRows = computed(() => rows(d.value.fore))
const efterRows = computed(() => rows(d.value.efter))

function advance() {
  if (store.mode === 'self') store.next()
}
</script>

<template>
  <div class="screen--reveal view" :class="{ 'reveal--named': named }" @click="advance">
    <div class="sweep go"></div>
    <div class="delta">
      <p class="delta__big">+{{ d.andrade }}</p>
      <p class="delta__lbl">tänkte om</p>
      <p class="delta__sub">
        {{ d.andrade > 0
          ? `${d.andrade} av ${d.jamforbara} flyttade sitt svar efter mötet med verkligheten.`
          : 'Gruppen stod fast vid sitt svar.' }}
      </p>
    </div>
    <div class="dist">
      <div>
        <h4>Före</h4>
        <div v-for="r in foreRows" :key="'f' + r.id" class="bar">
          <span class="bar__k" :style="{ color: r.color }">{{ r.label }}</span>
          <div class="bar__track"><div class="bar__fill" :style="{ width: r.pct + '%', background: r.color }">{{ r.n }}</div></div>
        </div>
      </div>
      <div>
        <h4>Efter</h4>
        <div v-for="r in efterRows" :key="'e' + r.id" class="bar">
          <span class="bar__k" :style="{ color: r.color }">{{ r.label }}</span>
          <div class="bar__track"><div class="bar__fill" :style="{ width: r.pct + '%', background: r.color }">{{ r.n }}</div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Namngivna alternativ ("Höj lönen" …) får en bredare, vänsterställd etikett-
 *  kolumn som kan radbrytas — ja/nej/kanske behåller sin smala kolumn. */
.reveal--named .bar {
  grid-template-columns: 10cqw 1fr;
}
.reveal--named .bar__k {
  text-align: left;
  font-size: 1.15cqw;
  line-height: 1.1;
  white-space: normal;
}
</style>
