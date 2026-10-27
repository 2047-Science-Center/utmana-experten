<script setup lang="ts">
/** Incheckning — skriv in spelarnamn per plats. Tomt fält → platshållarnamn.
 *  KÖR ▸ sparar ifyllda namn och startar omgången. */
import { ref } from 'vue'
import { useUtmanaStore } from '../store/utmanaStore'
import { audio } from '@/station-kit/audio/AudioEngine'
import { seatName } from '@/config'

const store = useUtmanaStore()
const emit = defineEmits<{ done: [] }>()
const names = ref<Record<number, string>>({})

/** Litet varmt kvitto när ett namn skrivs in. */
function nameEntered(n: number): void {
  if ((names.value[n] ?? '').trim()) audio.play('namn-klar')
}

function go() {
  for (const n of store.seats) {
    const v = (names.value[n] ?? '').trim()
    if (v) store.setPlayerName(n, v)
  }
  emit('done')
}
</script>

<template>
  <div class="screen--checkin view">
    <h1 class="checkin__title">Vilka spelar?</h1>
    <p class="checkin__hint">Skriv in namnen — eller klicka KÖR direkt, så blir det platshållarnamn.</p>
    <div class="checkin__grid">
      <label v-for="n in store.seats" :key="n" class="checkin__field">
        <span class="checkin__seat">Plats {{ n }}</span>
        <input
          v-model="names[n]"
          :placeholder="seatName(n)"
          class="checkin__input"
          maxlength="18"
          autocomplete="off"
          @change="nameEntered(n)"
          @keyup.enter="go"
        />
      </label>
    </div>
    <button class="gs-btn checkin__go" @click="go">KÖR ▸</button>
  </div>
</template>

<style scoped>
.screen--checkin {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2cqw;
  padding: 6cqw 6cqw 4cqw;
}
.checkin__title {
  font-family: var(--f-disp);
  font-weight: 800;
  font-size: 5cqw;
  color: var(--creme);
  margin: 0;
}
.checkin__hint {
  font-family: var(--f-text);
  font-size: 1.8cqw;
  color: var(--creme-dim);
  margin: 0 0 1cqw;
}
.checkin__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.4cqw 2.4cqw;
  width: 100%;
  max-width: 78cqw;
}
.checkin__field {
  display: flex;
  flex-direction: column;
  gap: 0.4cqw;
  min-width: 0;
}
.checkin__seat {
  font-family: var(--f-text);
  font-weight: 700;
  font-size: 1.3cqw;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--birch-lt);
}
.checkin__input {
  font-family: var(--f-disp);
  font-weight: 600;
  font-size: 2.4cqw;
  color: var(--creme);
  background: var(--panel);
  border: 0.22cqw solid var(--birch);
  border-radius: 12px;
  padding: 0.5em 0.6em;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.checkin__input:focus {
  border-color: var(--orange);
}
.checkin__input::placeholder {
  color: var(--creme-dim);
  opacity: 0.55;
}
.checkin__go {
  margin-top: 1.4cqw;
  font-size: 2.6cqw;
  padding: 0.5em 1.6em;
}
</style>
