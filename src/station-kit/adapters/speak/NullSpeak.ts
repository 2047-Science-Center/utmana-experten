/** Röst avstängd (pilot-default). No-op — texten bär allt. */
import type { Speak } from './Speak'

export class NullSpeak implements Speak {
  readonly enabled = false
  async speak(): Promise<void> {
    /* medvetet tyst */
  }
  cancel(): void {
    /* inget att avbryta */
  }
}
