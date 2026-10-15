<script setup lang="ts">
/**
 * On-screen spelledarpanel för PILOT — speglar Blocks-dirigenten. Varje knapp
 * går genom EXAKT samma söm som Blocks publicerar (store.onGm → gm/<cmd>):
 * FORMAT, MODE (self/gm), START, NÄSTA, MASTER. Så pilot och drift delar väg.
 * Döljs bakom ⚙ (diskret, nere till höger).
 */
import { ref } from 'vue'
import { useUtmanaStore } from '../store/utmanaStore'
import { FORMATS } from '../formats'

const store = useUtmanaStore()
const open = ref(false)
</script>

<template>
  <div class="panel">
    <button class="toggle crt-button" @click="open = !open" :aria-expanded="open">⚙</button>
    <div v-if="open" class="panel__body">
      <div class="panel__group">
        <span class="panel__label">FORMAT</span>
        <button
          v-for="f in FORMATS"
          :key="f.id"
          class="crt-button panel__btn"
          :class="{ 'crt-button--strong': store.format?.id === f.id }"
          @click="store.onGm({ cmd: 'format', value: f.id })"
        >
          {{ f.namn }}
        </button>
      </div>
      <div class="panel__group">
        <span class="panel__label">LÄGE</span>
        <button
          class="crt-button panel__btn"
          :class="{ 'crt-button--strong': store.mode === 'self' }"
          @click="store.onGm({ cmd: 'mode', value: 'self' })"
        >
          SJÄLVGÅENDE
        </button>
        <button
          class="crt-button panel__btn"
          :class="{ 'crt-button--strong': store.mode === 'gm' }"
          @click="store.onGm({ cmd: 'mode', value: 'gm' })"
        >
          SPELLEDARE
        </button>
      </div>
      <div class="panel__group">
        <button class="crt-button panel__btn" @click="store.onGm({ cmd: 'start', value: '1' })">START</button>
        <button class="crt-button panel__btn" @click="store.onGm({ cmd: 'nasta', value: '1' })">NÄSTA ▸</button>
        <button
          class="crt-button panel__btn"
          :class="{ 'crt-button--danger': store.masterLocked }"
          @click="store.onGm({ cmd: 'master', value: store.masterLocked ? '0' : '1' })"
        >
          MASTER {{ store.masterLocked ? 'PÅ' : 'AV' }}
        </button>
      </div>
      <div class="panel__group panel__test">
        <span class="panel__label">TEST: knapp (= hårdvarans utmanaexperten/knapp)</span>
        <div v-for="plats in store.seats" :key="plats" class="panel__seat">
          <span class="panel__seatn">P{{ plats }}</span>
          <button class="crt-button panel__vote panel__vote--ja" @click="store.onKnapp(plats, 'ja')">JA</button>
          <button class="crt-button panel__vote panel__vote--nej" @click="store.onKnapp(plats, 'nej')">NEJ</button>
          <button class="crt-button panel__vote panel__vote--kanske" @click="store.onKnapp(plats, 'kanske')">KA</button>
        </div>
        <button
          v-if="store.stepType === 'speak_round' && store.activePlats"
          class="crt-button panel__btn"
          @click="store.onKnapp(store.activePlats, 'ja')"
        >
          KLAR ▸ (plats {{ store.activePlats }})
        </button>
      </div>
      <p class="panel__hint">
        Pilot-panel. I drift kommer dessa från Blocks-dirigenten via
        <code>utmanaexperten/gm/*</code>; knapparna sitter på borden.
      </p>
    </div>
  </div>
</template>

<style scoped>
.panel {
  position: fixed;
  right: 0.75rem;
  bottom: 0.75rem;
  z-index: 300;
  font-family: var(--font-retro);
  text-align: right;
}
.toggle {
  font-size: 1.1rem;
  padding: 0.2em 0.5em;
  opacity: 0.6;
}
.toggle:hover {
  opacity: 1;
}
.panel__body {
  margin-top: 0.4rem;
  background: var(--color-background-2);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 280px;
  max-height: 78vh;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}
.panel__group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
  justify-content: flex-end;
}
.panel__label {
  color: var(--color-ink-muted);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  width: 100%;
  text-align: right;
}
.panel__btn {
  font-size: 0.8rem;
  padding: 0.25em 0.6em;
}
.panel__test {
  border-top: 1px solid var(--color-primary-dim);
  padding-top: 0.4rem;
}
.panel__seat {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  width: 100%;
  justify-content: flex-end;
}
.panel__seatn {
  color: var(--color-ink-muted);
  font-size: 0.72rem;
  margin-right: auto;
}
.panel__vote {
  font-size: 0.68rem;
  padding: 0.15em 0.45em;
}
.panel__vote--ja { color: var(--vote-ja); border-color: var(--vote-ja); }
.panel__vote--nej { color: var(--vote-nej); border-color: var(--vote-nej); }
.panel__vote--kanske { color: var(--vote-kanske); border-color: var(--vote-kanske); }
.panel__hint {
  color: var(--color-ink-muted);
  font-size: 0.72rem;
  margin: 0;
}
.panel__hint code {
  color: var(--color-primary);
}
</style>
