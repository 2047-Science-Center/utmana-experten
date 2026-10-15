/**
 * Pilot-ljus: luckraden på skärmen. Lyser enligt exakt samma
 * { hatch, state, winner } som MqttLights skulle skicka — samma anrop, olika
 * output. Håller ett reaktivt tillstånd som HatchRow-komponenten läser.
 */

import { ref, type Ref } from 'vue'
import type { Lights } from './Lights'
import type { HatchLight } from './Lights'

export class ScreenLights implements Lights {
  /** Reaktivt — luckrad-komponenten binder mot detta. */
  readonly state: Ref<HatchLight[]> = ref([])

  set(lights: HatchLight[]): void {
    this.state.value = lights
  }

  reset(): void {
    this.state.value = this.state.value.map((l) => ({
      hatch: l.hatch,
      state: 'off',
      winner: null,
    }))
  }
}
