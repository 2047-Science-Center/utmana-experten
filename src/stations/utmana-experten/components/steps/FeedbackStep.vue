<script setup lang="ts">
/** feedback — AI:ns personliga text per plats som studions namnskyltar
 *  (Designförslag B): platsfärg, namn, eget svar, "så här tänkte du". /speak är
 *  valfri add-on bakom flaggan (av). Self-läge: klick = fortsätt. */
import { computed, onMounted } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import { seatName } from '@/config'

const store = useUtmanaStore()

const voteOf = computed(() => {
  const map: Record<number, string> = {}
  for (const v of store.votes['fore'] ?? []) map[v.plats] = v.val
  return map
})

const plates = computed(() =>
  store.assessments
    .filter((a) => a.plats > 0)
    .map((a) => ({ plats: a.plats, namn: seatName(a.plats), val: voteOf.value[a.plats] ?? '', text: a.svar_text })),
)

onMounted(() => {
  const first = store.assessments[0]
  if (first) void store.speakNpc(first.svar_text)
})

function advance() {
  if (store.mode === 'self') store.next()
}
function voteLabel(v: string) {
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : ''
}
</script>

<template>
  <div class="screen--feedback view" @click="advance">
    <h2 class="fb__title">Så här tänkte ni</h2>
    <div class="fb__grid">
      <div v-for="p in plates" :key="p.plats" class="plate">
        <span class="plate__tab" :class="p.val"></span>
        <div>
          <div class="plate__name">
            {{ p.namn }}
            <span v-if="p.val" class="plate__vote" :class="p.val">{{ voteLabel(p.val) }}</span>
          </div>
          <p class="plate__text">{{ p.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
