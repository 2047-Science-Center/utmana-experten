<script setup lang="ts">
/** reveal — före→efter-glappet (Designförslag B): stort delta + fördelnings-
 *  staplar + ljus-svep. Self-läge: klick = fortsätt (avslutar rundan). */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'

const store = useUtmanaStore()

const VALS = ['ja', 'kanske', 'nej'] as const
const KLBL: Record<string, string> = { ja: 'JA', kanske: 'KANS', nej: 'NEJ' }

const d = computed(() => store.delta)
const maxN = computed(() => {
  const all = [...Object.values(d.value.fore), ...Object.values(d.value.efter), 1]
  return Math.max(...all)
})
function rows(tally: Record<string, number>) {
  return VALS.map((v) => ({ v, n: tally[v] ?? 0, pct: Math.round(((tally[v] ?? 0) / maxN.value) * 100) }))
}
const foreRows = computed(() => rows(d.value.fore))
const efterRows = computed(() => rows(d.value.efter))

function advance() {
  if (store.mode === 'self') store.next()
}
</script>

<template>
  <div class="screen--reveal view" @click="advance">
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
        <div v-for="r in foreRows" :key="'f' + r.v" class="bar">
          <span class="bar__k" :class="r.v">{{ KLBL[r.v] }}</span>
          <div class="bar__track"><div class="bar__fill" :class="r.v" :style="{ width: r.pct + '%' }">{{ r.n }}</div></div>
        </div>
      </div>
      <div>
        <h4>Efter</h4>
        <div v-for="r in efterRows" :key="'e' + r.v" class="bar">
          <span class="bar__k" :class="r.v">{{ KLBL[r.v] }}</span>
          <div class="bar__track"><div class="bar__fill" :class="r.v" :style="{ width: r.pct + '%' }">{{ r.n }}</div></div>
        </div>
      </div>
    </div>
  </div>
</template>
