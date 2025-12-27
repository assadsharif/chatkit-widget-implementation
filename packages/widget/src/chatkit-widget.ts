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
import { RAGClient, RAGClientError } from './services/rag-client.js';

export class ChatKitWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private ragClient: RAGClient;
  private sessionId: string;

  constructor() {
    super();
    // Attach Shadow DOM (encapsulation)
    this.shadow = this.attachShadow({ mode: 'open' });

    // Initialize RAG client
    this.ragClient = new RAGClient();

    // Generate session ID (UUID v4)
    this.sessionId = crypto.randomUUID();
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

    // Listen to own event and send to backend
    this.addEventListener('chatkit:send', ((e: ChatKitSendEvent) => {
      this.appendMessage(e.detail.message, 'user');
      this.handleRAGQuery(e.detail.message);
    }) as EventListener);
  }

  private async handleRAGQuery(message: string): Promise<void> {
    // Show loading state
    const loadingId = this.appendMessage('Thinking...', 'assistant', true);

    try {
      // Call RAG backend
      const response = await this.ragClient.sendMessage({
        message,
        context: {
          mode: 'browse',
          session_id: this.sessionId,
        },
        tier: 'anonymous',
      });

      // Remove loading message
      this.removeMessage(loadingId);

      // Display answer
      this.appendMessage(response.answer, 'assistant');

    } catch (error) {
      // Remove loading message
      this.removeMessage(loadingId);

      // Handle errors
      if (error instanceof RAGClientError) {
        this.appendMessage(this.getErrorMessage(error.code), 'assistant');
      } else {
        this.appendMessage('Sorry, something went wrong. Please try again.', 'assistant');
      }
    }
  }

  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'INVALID_REQUEST': 'Your message appears to be invalid. Please try again.',
      'MESSAGE_TOO_LONG': 'Your message is too long. Please keep it under 2000 characters.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
      'NETWORK_ERROR': 'Unable to connect to the service. Please check your connection.',
      'REQUEST_TIMEOUT': "I'm offline right now, I'll reconnect shortly.",
      'REQUEST_CANCELLED': 'Request was cancelled.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }

  private appendMessage(content: string, role: 'user' | 'assistant', isLoading: boolean = false): string {
    const messagesContainer = this.shadow.querySelector('.chatkit-messages');
    if (!messagesContainer) return '';

    // Remove placeholder on first message
    const placeholder = this.shadow.querySelector('.chatkit-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    messageDiv.id = messageId;
    messageDiv.className = `chatkit-message chatkit-message-${role}${isLoading ? ' chatkit-message-loading' : ''}`;
    messageDiv.textContent = content;

    // Append to container
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageId;
  }

  private removeMessage(messageId: string): void {
    const message = this.shadow.getElementById(messageId);
    if (message) {
      message.remove();
    }
  }
}

// Register custom element
if (!customElements.get('chatkit-widget')) {
  customElements.define('chatkit-widget', ChatKitWidget);
}
