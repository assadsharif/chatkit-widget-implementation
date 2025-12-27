/**
 * CustomEvent Contracts
 *
 * Defines events emitted by the ChatKit Widget.
 * Aligns with Event-Driven Architecture (Pattern 1) from frozen design.
 */

export class ChatKitEvent extends CustomEvent<any> {
  constructor(type: string, detail: any) {
    super(type, { detail, bubbles: true, composed: true });
  }
}
