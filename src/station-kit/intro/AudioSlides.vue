<script setup lang="ts">
/**
 * Cue-driven "audio + slides"-spelare (§8, återanvändbar). Spelar ett ljudklipp
 * och följer en cue-tidslinje: byter foto, växlar center/split-läge med svep,
 * och exponerar aktuell cue + ljudklockan (t) till en `split`-slot där stationen
 * kör sin live-UI-mock. Renderar undertext från en .vtt synkat mot ljudet.
 * Diskret "Hoppa över". Ingen besökar-paus som default. Reduced-motion: svep av.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { IntroCue } from './introTypes'
import { parseVtt, cueAt, type VttCue } from './vtt'
import { useI18n } from '../i18n'

const props = defineProps<{
  audioSrc: string
  subtitleSrc?: string
  cues: IntroCue[]
  photoUrl: (n: number) => string
  /** Delad starttid (epoch-ms) → ljudet synkas till (now - startEpoch). */
  startEpoch?: number
}>()
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()

const audio = ref<HTMLAudioElement | null>(null)
const now = ref(0)
const started = ref(false)
const subs = ref<VttCue[]>([])
let raf = 0

/** Aktuell cue = sista cue vars tid passerats. */
const currentCue = computed<IntroCue | null>(() => {
  let cur: IntroCue | null = null
  for (const c of props.cues) {
    if (now.value + 0.001 >= c.time) cur = c
    else break
  }
  return cur ?? props.cues[0] ?? null
})
const mode = computed(() => currentCue.value?.mode ?? 'center')
const photo = computed(() => currentCue.value?.photo ?? 1)
const isMemory = computed(() => currentCue.value?.memory ?? false)
const subtitle = computed(() => cueAt(subs.value, now.value)?.text ?? '')
/** Sekunder sedan aktuell cue startade — driver återanvändbara illustrationer. */
const elapsed = computed(() => now.value - (currentCue.value?.time ?? 0))

function tick() {
  const a = audio.value
  if (a) {
    now.value = a.currentTime
    // Synka mot delad starttid: korrigera drift mellan skärmarna.
    if (props.startEpoch != null && !a.paused && a.readyState >= 2) {
      const expected = (Date.now() - props.startEpoch) / 1000
      if (expected >= 0 && Math.abs(a.currentTime - expected) > 0.35) {
        a.currentTime = expected
      }
    }
  }
  raf = requestAnimationFrame(tick)
}

function finish() {
  cancelAnimationFrame(raf)
  audio.value?.pause()
  emit('done')
}

function skip() {
  finish()
}

onMounted(async () => {
  const a = audio.value
  if (a) {
    a.onended = finish
    // Synka till delad starttid innan uppspelning.
    if (props.startEpoch != null) {
      const expected = (Date.now() - props.startEpoch) / 1000
      const seekTo = Math.max(0, expected)
      const seek = () => {
        try {
          a.currentTime = seekTo
        } catch {
          /* ignore */
        }
      }
      if (a.readyState >= 1) seek()
      else a.addEventListener('loadedmetadata', seek, { once: true })
    }
    // Spela FÖRST — direkt efter mount, medan BÖRJA-klickets user-activation
    // fortfarande gäller. En await (t.ex. undertext-fetch) före detta kan äta
    // upp gesten så webbläsaren blockerar uppspelningen (→ play-knappen).
    try {
      await a.play()
      started.value = true
    } catch {
      // Autoplay ändå blockerad — visa tryck-för-att-spela som fallback.
      started.value = false
    }
  }
  raf = requestAnimationFrame(tick)

  // Undertext hämtas EFTER uppspelningsförsöket (får inte fördröja play()).
  if (props.subtitleSrc) {
    try {
      const res = await fetch(props.subtitleSrc)
      if (res.ok) subs.value = parseVtt(await res.text())
    } catch {
      subs.value = []
    }
  }
})
onUnmounted(() => cancelAnimationFrame(raf))

async function manualStart() {
  try {
    await audio.value?.play()
    started.value = true
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="as" :class="`as--${mode}`">
    <audio ref="audio" :src="audioSrc" preload="auto"></audio>

    <!-- Flashback: tillbakablick till en tidigare förhandling — bultar tydligt i mitten. -->
    <div v-if="isMemory" class="as__flashback" aria-live="polite">
      <span class="as__flashback-badge">◉ REC</span>
      <span class="as__flashback-text">{{ t('intro.memory') }}</span>
    </div>

    <!-- Förhandlingsdemo (negotiate): stationen äger foto + talarmarkering + settle-UI -->
    <div v-if="mode === 'negotiate'" class="as__negotiate">
      <slot name="negotiate" :cue="currentCue" :t="now" :elapsed="elapsed" :photoUrl="photoUrl" />
    </div>

    <template v-else>
      <!-- Foto (mitten eller vänster i split) -->
      <div class="as__photo amber-frame" :class="{ 'as__photo--memory': isMemory }">
        <transition name="photo" mode="out-in">
          <img :key="photo" :src="photoUrl(photo)" alt="" />
        </transition>
      </div>

      <!-- Split-höger: enkel-demo (stationens illustration) -->
      <div class="as__split">
        <slot name="split" :cue="currentCue" :t="now" :elapsed="elapsed" />
      </div>
    </template>

    <!-- Undertext (från .vtt, synkad mot ljudet) -->
    <div class="as__subtitle" v-if="subtitle">
      <span>{{ subtitle }}</span>
    </div>

    <!-- Kontroller -->
    <button v-if="!started" class="crt-button as__play" @click="manualStart">▶</button>
    <button class="as__skip" @click="skip">{{ t('intro.skip') }} ▸</button>
  </div>
</template>

<style scoped>
.as {
  position: relative;
  display: flex;
  gap: 1rem;
  height: 100%;
  align-items: stretch;
}
.as--negotiate {
  display: block;
}
.as__negotiate {
  height: 100%;
}
/* Flashback-banner: tydlig, bultande "inspelning från tidigare förhandling". */
.as__flashback {
  position: absolute;
  top: 7%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  background: rgba(5, 16, 11, 0.82);
  box-shadow: 0 0 22px rgba(255, 149, 0, 0.4);
  animation: as-flashback-throb 1.3s ease-in-out infinite;
  pointer-events: none;
  max-width: 92%;
}
.as__flashback-badge {
  font-family: var(--font-retro);
  font-size: 1rem;
  letter-spacing: 0.12em;
  color: var(--color-danger, #ff5a5a);
  animation: as-flashback-blink 1s steps(1, end) infinite;
}
.as__flashback-text {
  font-family: var(--font-retro);
  font-size: clamp(1.1rem, 2.4vw, 1.6rem);
  letter-spacing: 0.06em;
  color: var(--color-ink-strong);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@keyframes as-flashback-throb {
  0%, 100% { transform: translateX(-50%) scale(1); box-shadow: 0 0 16px rgba(255, 149, 0, 0.3); }
  50% { transform: translateX(-50%) scale(1.06); box-shadow: 0 0 30px rgba(255, 149, 0, 0.6); }
}
@keyframes as-flashback-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.15; }
}
@media (prefers-reduced-motion: reduce) {
  .as__flashback { animation: none; }
  .as__flashback-badge { animation: none; }
}
.as__photo {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 100%;
  transition: flex-basis 0.7s cubic-bezier(0.5, 0, 0.3, 1);
  flex-basis: 100%;
}
.as__photo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: filter 0.6s ease;
}
/* Retrospekt/minne: ljus från tidigare förhandling. */
.as__photo--memory img {
  filter: sepia(0.5) saturate(0.7) contrast(1.05) brightness(0.85) hue-rotate(-12deg);
  animation: memory-flicker 3.5s ease-in-out infinite;
}
.as__memory {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  font-family: var(--font-retro);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  color: var(--color-primary);
  background: rgba(5, 16, 11, 0.55);
  border: 1px solid var(--color-primary-dim);
  border-radius: 6px;
  padding: 0.15em 0.6em;
  animation: memory-pulse 1.6s ease-in-out infinite;
  z-index: 10;
}
@keyframes memory-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; text-shadow: var(--glow-soft); }
}
@keyframes memory-flicker {
  0%, 100% { opacity: 1; }
  48% { opacity: 0.92; }
  50% { opacity: 0.8; }
  52% { opacity: 0.94; }
}
@media (prefers-reduced-motion: reduce) {
  .as__photo--memory img,
  .as__memory {
    animation: none;
  }
}
.as__split {
  flex: 0 0 0%;
  width: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    flex-basis 0.7s cubic-bezier(0.5, 0, 0.3, 1),
    opacity 0.5s ease 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.as--split .as__photo {
  flex-basis: 44%;
}
.as--split .as__split {
  flex: 0 0 56%;
  width: auto;
  opacity: 1;
}

.as__subtitle {
  position: absolute;
  left: 50%;
  bottom: 1.2rem;
  transform: translateX(-50%);
  max-width: 80%;
  text-align: center;
  background: rgba(5, 16, 11, 0.82);
  border: 1px solid var(--color-primary-dim);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 1.25rem;
  color: var(--color-ink-strong);
  line-height: 1.4;
  z-index: 20;
}
.as__skip {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  font-family: var(--font-retro);
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  background: rgba(5, 16, 11, 0.6);
  border: 1px solid var(--color-primary-dim);
  border-radius: 6px;
  padding: 0.2em 0.7em;
  cursor: pointer;
  z-index: 21;
}
.as__skip:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.as__play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  z-index: 22;
}

.photo-enter-active,
.photo-leave-active {
  transition: opacity 0.4s ease;
}
.photo-enter-from,
.photo-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .as__photo,
  .as__split {
    transition: none;
  }
  .photo-enter-active,
  .photo-leave-active {
    transition: none;
  }
}
</style>
