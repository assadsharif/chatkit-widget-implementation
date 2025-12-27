/**
 * ChatKit Widget - Custom Element
 *
 * Framework-agnostic Web Component for embedding ChatKit functionality.
 *
 * Usage:
 *   <chatkit-widget></chatkit-widget>
 *
 * Implementation derived from frozen design at commit 5b2a756.
 */

import { getTemplate } from './shadow-dom/template.js';
import { getStyles } from './shadow-dom/styles.js';
import { ChatKitSendEvent } from './events/widget-events.js';

export class ChatKitWidget extends HTMLElement {
  private shadow: ShadowRoot;

  constructor() {
    super();
    // Attach Shadow DOM (encapsulation)
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Called when element is added to DOM
    this.render();
    this.wireEvents();
  }

  disconnectedCallback() {
    // Called when element is removed from DOM
    // Cleanup will be added in later phases
  }

  private render(): void {
    // Inject template
    const template = document.createElement('template');
    template.innerHTML = getTemplate();

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = getStyles();

    // Attach to Shadow DOM
    this.shadow.appendChild(styleSheet);
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  private wireEvents(): void {
    // Get elements from Shadow DOM
    const input = this.shadow.querySelector('.chatkit-input') as HTMLInputElement;
    const sendBtn = this.shadow.querySelector('.chatkit-send-btn') as HTMLButtonElement;

    if (!input || !sendBtn) return;

    // Wire send button click
    sendBtn.addEventListener('click', () => {
      const message = input.value.trim();
      if (!message) return;

      // Dispatch custom event
      const event = new ChatKitSendEvent({
        message,
        timestamp: Date.now(),
      });
      this.dispatchEvent(event);

      // Clear input
      input.value = '';
    });

    // Wire enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });

    // Listen to own event and append message (local only)
    this.addEventListener('chatkit:send', ((e: ChatKitSendEvent) => {
      this.appendMessage(e.detail.message, 'user');
      // Static bot reply (no backend)
      setTimeout(() => {
        this.appendMessage("Thanks! I'll answer once connected.", 'assistant');
      }, 500);
    }) as EventListener);
  }

  private appendMessage(content: string, role: 'user' | 'assistant'): void {
    const messagesContainer = this.shadow.querySelector('.chatkit-messages');
    if (!messagesContainer) return;

    // Remove placeholder on first message
    const placeholder = this.shadow.querySelector('.chatkit-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatkit-message chatkit-message-${role}`;
    messageDiv.textContent = content;

    // Append to container
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Register custom element
if (!customElements.get('chatkit-widget')) {
  customElements.define('chatkit-widget', ChatKitWidget);
}
