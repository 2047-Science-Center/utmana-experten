<script setup lang="ts">
/** present — frågan överst/centralt (Designförslag B). Chips i knappordning
 *  (ja/nej/kanske ELLER namngivna alternativ). I self-läge: klick var som helst
 *  = fortsätt (fysisk knapp i drift). */
import { computed } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import { slotsOf } from '../../engine/voteSlots'
import { media } from '../../media/manifest'
import MediaSlot from '../../media/MediaSlot.vue'
import type { PresentStep } from '../../engine/types'

const props = defineProps<{ step: PresentStep }>()
const store = useUtmanaStore()

const fraga = computed(() => store.format?.fraga ?? '')
const brodtext = computed(() => store.format?.brodtext ?? '')
const irl = computed(() => props.step.source === 'irl')
const slots = computed(() => slotsOf(store.format))
/** Variant-format (t.ex. Ändra dig): rubriken = variantens titel (yrkestiteln
 *  man reagerar på), frågan visas som underrubrik. Annars = formatets fråga. */
const variant = computed(() => store.activeVariant)
const headline = computed(() => variant.value?.titel ?? fraga.value)
const subfraga = computed(() => (variant.value ? fraga.value : ''))
/** Har alternativen förklaringar? → visa alternativ-kort i stället för chip-rad. */
const hasAltInfo = computed(() => slots.value.some((s) => s.beskrivning))
/** Visa en bild/klipp i presentationen om contentId har ett RIKTIGT media
 *  (t.ex. Rådgivarens dilemma-scen). Annars ren text (som förr). */
const visual = computed(() => {
  const m = media(store.format?.id ?? '', props.step.contentId)
  return m.src ? props.step.contentId : null
})

function advance() {
  if (store.mode === 'self') store.next()
}
</script>

<template>
  <div class="screen--fraga view" :class="{ 'screen--fraga-rich': visual || brodtext || hasAltInfo }" @click="advance">
    <template v-if="irl">
      <p class="fraga__num">Titta upp</p>
      <h1 class="fraga__q">{{ fraga }}</h1>
    </template>
    <template v-else>
      <div class="fraga__num">{{ store.format?.namn }}</div>
      <div v-if="visual" class="present__visual">
        <MediaSlot :format="store.format?.id ?? ''" :content-id="visual" />
      </div>
      <h1 class="fraga__q" :class="{ 'present__q--with-visual': visual, 'present__q--titel': variant }">{{ headline }}</h1>
      <p v-if="subfraga" class="present__subfraga">{{ subfraga }}</p>
      <p v-if="brodtext" class="present__brod">{{ brodtext }}</p>

      <!-- Namngivna alternativ med förklaring → kort; annars ren chip-rad. -->
      <div v-if="hasAltInfo" class="alt-cards">
        <div v-for="slot in slots" :key="slot.id" class="alt-card">
          <span class="alt-card__dot" :style="{ background: slot.color }"></span>
          <span class="alt-card__label" :style="{ color: slot.color }">{{ slot.label }}</span>
          <span v-if="slot.beskrivning" class="alt-card__desc">{{ slot.beskrivning }}</span>
        </div>
      </div>
      <div v-else class="stance">
        <span v-for="slot in slots" :key="slot.id" class="chip" :style="{ color: slot.color }">{{ slot.label }}</span>
      </div>

      <p class="fraga__hint">Svara på knapparna vid din plats</p>
    </template>
  </div>
</template>

<style scoped>
/* Namngivna alternativ kan vara längre än JA/NEJ — håll chip-raden luftig och
 *  versal för game-show-känslan oavsett format. */
.stance {
  flex-wrap: wrap;
  gap: 1.2cqw 1.6cqw;
}
.stance .chip {
  text-transform: uppercase;
}

/* Innehållsrik present (dilemma-scen + ingress + alternativ-kort): tightare
 *  radavstånd så allt ryms i 16:9 utan scroll. */
.screen--fraga-rich {
  align-content: center;
  padding: 2.5cqw 7cqw;
}

/* Film-still/dilemma-scen: liggande bild överst, frågan som rubrik under. */
.present__visual {
  width: min(42cqw, 58%);
  margin: 0 auto 0.6cqw;
}
.present__visual :deep(img),
.present__visual :deep(video) {
  border-radius: 14px;
}
.fraga__q.present__q--with-visual {
  font-size: 2.3cqw;
  line-height: 1.22;
  max-width: 44ch;
  margin-top: 1cqw;
  font-weight: 700;
}

/* Variant-titel (yrkestiteln man reagerar på) — stor och dramatisk. */
.fraga__q.present__q--titel {
  font-size: 6cqw;
  line-height: 1.02;
  letter-spacing: -0.02em;
  max-width: 90%;
}
/* Frågan som underrubrik under variant-titeln. */
.present__subfraga {
  font-family: var(--f-text);
  font-size: 2.2cqw;
  line-height: 1.3;
  color: var(--creme-dim);
  margin: 1.2cqw auto 0;
}

/* Ingress/ram under frågan. */
.present__brod {
  font-family: var(--f-text);
  font-size: 1.7cqw;
  line-height: 1.35;
  color: var(--birch-lt);
  max-width: 50ch;
  margin: 1.1cqw auto 0;
}

/* Alternativ-kort: färgprick + etikett + förklaring, i knappordning. */
.alt-cards {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.4cqw;
  margin: 1.8cqw auto 0;
  max-width: 80cqw;
}
.alt-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 0.6cqw;
  width: 22cqw;
  min-height: 9cqw;
  padding: 1.2cqw 1.3cqw;
  background: var(--panel);
  border: 0.18cqw solid var(--birch);
  border-radius: 14px;
  box-sizing: border-box;
}
.alt-card__dot {
  width: 1.3cqw;
  height: 1.3cqw;
  border-radius: 50%;
  flex: none;
}
.alt-card__label {
  font-family: var(--f-disp);
  font-weight: 700;
  font-size: 1.9cqw;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}
.alt-card__desc {
  font-family: var(--f-text);
  font-size: 1.35cqw;
  line-height: 1.32;
  color: var(--creme-dim);
}
.screen--fraga-rich .fraga__hint {
  margin-top: 1.8cqw;
}
</style>
