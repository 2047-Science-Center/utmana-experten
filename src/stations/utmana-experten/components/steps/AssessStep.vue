<script setup lang="ts">
/** assess — latensmask (Designförslag B): snurrande planet + skannande sken
 *  medan per-person-bedömningen hämtas; hästskon vilar dämpad. Storen auto-går
 *  vidare när svaren är klara. */
import Horseshoe from '../Horseshoe.vue'
</script>

<template>
  <div class="screen--scene view">
    <div class="stage">
      <Horseshoe :dim="true" />
    </div>
    <div class="think">
      <svg class="think__planet spin" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="58" r="26" fill="#d4682e" />
        <circle cx="52" cy="50" r="7" fill="#e9915c" opacity=".7" />
        <ellipse cx="60" cy="60" rx="48" ry="15" fill="none" stroke="#c89b5e" stroke-width="4" transform="rotate(-18 60 60)" />
      </svg>
      <h3>Experten tänker<span class="dots"></span></h3>
      <p>Väger samman allas svar mot hur arbetslivet faktiskt ser ut.</p>
      <div class="think__bar"><i></i></div>
    </div>
  </div>
</template>
