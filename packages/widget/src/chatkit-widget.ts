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
import { AuthClient } from './services/auth-client.js';

export class ChatKitWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private ragClient: RAGClient;
  private authClient: AuthClient;
  private sessionId: string;
  private questionCount: number = 0;

  constructor() {
    super();
    // Attach Shadow DOM (encapsulation)
    this.shadow = this.attachShadow({ mode: 'open' });

    // Initialize RAG client
    this.ragClient = new RAGClient();

    // Initialize Auth client (Phase 7C-B)
    this.authClient = new AuthClient();

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

      // STEP 2: Widget Trigger - 5th question (ONLY THIS)
      // Increment question count
      this.questionCount++;

      // Trigger soft prompt on 5th question (if not dismissed)
      if (this.questionCount === 5 && !this.authClient.wasSoftPromptDismissed()) {
        this.authClient.showSoftPrompt();
        this.showSoftPrompt();
      }

      this.handleRAGQuery(e.detail.message);
    }) as EventListener);

    // STEP 3: Wire auth UI components
    this.wireSoftPrompt();
    this.wireSignupModal();
  }

  private wireSoftPrompt(): void {
    const softPrompt = this.shadow.querySelector('.chatkit-soft-prompt') as HTMLElement;
    const closeBtn = this.shadow.querySelector('.chatkit-soft-prompt-close') as HTMLButtonElement;
    const ctaLink = this.shadow.querySelector('.chatkit-soft-prompt-cta') as HTMLAnchorElement;

    if (!softPrompt || !closeBtn || !ctaLink) return;

    // Wire close button (dismiss)
    closeBtn.addEventListener('click', () => {
      this.authClient.dismissSoftPrompt();
      this.hideSoftPrompt();
    });

    // Wire CTA link (open signup modal)
    ctaLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.authClient.openSignupModal();
      this.hideSoftPrompt();
      this.showSignupModal();
    });
  }

  private wireSignupModal(): void {
    const modalOverlay = this.shadow.querySelector('.chatkit-modal-overlay') as HTMLElement;
    const modalClose = this.shadow.querySelector('.chatkit-modal-close') as HTMLButtonElement;
    const modalCancel = this.shadow.querySelector('.chatkit-modal-cancel') as HTMLButtonElement;
    const modalSubmit = this.shadow.querySelector('.chatkit-modal-submit') as HTMLButtonElement;
    const emailInput = this.shadow.querySelector('.chatkit-email-input') as HTMLInputElement;
    const consentCheckbox = this.shadow.querySelector('.chatkit-consent-checkbox') as HTMLInputElement;
    const errorDiv = this.shadow.querySelector('.chatkit-modal-error') as HTMLElement;

    if (!modalOverlay || !modalClose || !modalCancel || !modalSubmit || !emailInput || !consentCheckbox || !errorDiv) return;

    // Wire close button (X)
    modalClose.addEventListener('click', () => {
      this.authClient.closeSignupModal();
      this.hideSignupModal();
      this.clearSignupForm();
    });

    // Wire cancel button
    modalCancel.addEventListener('click', () => {
      this.authClient.closeSignupModal();
      this.hideSignupModal();
      this.clearSignupForm();
    });

    // Wire submit button
    modalSubmit.addEventListener('click', async () => {
      await this.handleSignup(emailInput, consentCheckbox, errorDiv, modalSubmit);
    });

    // Wire enter key on email input
    emailInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await this.handleSignup(emailInput, consentCheckbox, errorDiv, modalSubmit);
      }
    });

    // Close modal when clicking overlay (outside modal)
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        this.authClient.closeSignupModal();
        this.hideSignupModal();
        this.clearSignupForm();
      }
    });
  }

  private async handleSignup(
    emailInput: HTMLInputElement,
    consentCheckbox: HTMLInputElement,
    errorDiv: HTMLElement,
    submitBtn: HTMLButtonElement
  ): Promise<void> {
    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    const email = emailInput.value.trim();
    const consent = consentCheckbox.checked;

    // Disable submit button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing up...';

    try {
      const response = await this.authClient.signup({
        email,
        consent_data_storage: consent,
      });

      if (response.status === 'verification_sent') {
        // Success - show success message
        this.hideSignupModal();
        this.clearSignupForm();
        this.appendMessage(
          `✅ Verification email sent to ${email}. Please check your inbox!`,
          'assistant'
        );
      }
    } catch (error: any) {
      // Show error
      errorDiv.style.display = 'block';
      errorDiv.textContent = error.message || 'An error occurred. Please try again.';
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
    }
  }

  private showSoftPrompt(): void {
    const softPrompt = this.shadow.querySelector('.chatkit-soft-prompt') as HTMLElement;
    if (softPrompt) {
      softPrompt.style.display = 'block';
    }
  }

  private hideSoftPrompt(): void {
    const softPrompt = this.shadow.querySelector('.chatkit-soft-prompt') as HTMLElement;
    if (softPrompt) {
      softPrompt.style.display = 'none';
    }
  }

  private showSignupModal(): void {
    const modalOverlay = this.shadow.querySelector('.chatkit-modal-overlay') as HTMLElement;
    if (modalOverlay) {
      modalOverlay.style.display = 'flex';
    }
  }

  private hideSignupModal(): void {
    const modalOverlay = this.shadow.querySelector('.chatkit-modal-overlay') as HTMLElement;
    if (modalOverlay) {
      modalOverlay.style.display = 'none';
    }
  }

  private clearSignupForm(): void {
    const emailInput = this.shadow.querySelector('.chatkit-email-input') as HTMLInputElement;
    const consentCheckbox = this.shadow.querySelector('.chatkit-consent-checkbox') as HTMLInputElement;
    const errorDiv = this.shadow.querySelector('.chatkit-modal-error') as HTMLElement;

    if (emailInput) emailInput.value = '';
    if (consentCheckbox) consentCheckbox.checked = false;
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
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
