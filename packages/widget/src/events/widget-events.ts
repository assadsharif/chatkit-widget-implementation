/**
 * CustomEvent Contracts
 *
 * Defines events emitted by the ChatKit Widget.
 * Aligns with Event-Driven Architecture (Pattern 1) from frozen design.
 *
 * Phase 7A-2: Local event wiring only (no backend)
 */

// Event payload types
export interface ChatKitSendPayload {
  message: string;
  timestamp: number;
}

// Custom event class
export class ChatKitSendEvent extends CustomEvent<ChatKitSendPayload> {
  constructor(detail: ChatKitSendPayload) {
    super('chatkit:send', {
      detail,
      bubbles: true,
      composed: true, // Crosses shadow DOM boundary
    });
  }
}
