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
  private messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private anonSessionId: string | null = null;
  private refreshInterval: number | null = null;

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
    this.initSession();
  }

  private async initSession(): Promise<void> {
    // Phase 7C-C: Auto-detect session on widget load
    // Check if session exists in storage and validate with backend
    const isValid = await this.authClient.checkSession();

    if (isValid) {
      // Show action bar for authenticated users
      this.showActionBar();

      // Phase 9: Check email verification status
      await this.checkEmailVerification();

      // Phase 9: Setup session auto-refresh (every 5 minutes)
      this.refreshInterval = window.setInterval(async () => {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          this.showToast('Session expired. Please log in again.', 'error');
          await this.handleLogout();
        }
      }, 300000); // 5 minutes

      // Phase 9: Check for anonymous session migration
      await this.checkMigration();
    } else {
      // Phase 9: Generate anonymous session ID for potential migration
      this.anonSessionId = localStorage.getItem('anon_session_id');
      if (!this.anonSessionId) {
        this.anonSessionId = crypto.randomUUID();
        localStorage.setItem('anon_session_id', this.anonSessionId);
      }
    }
  }

  private showActionBar(): void {
    const actionBar = this.shadow.querySelector('.chatkit-action-bar') as HTMLElement;
    if (actionBar) {
      actionBar.style.display = 'flex';
    }
  }

  private hideActionBar(): void {
    const actionBar = this.shadow.querySelector('.chatkit-action-bar') as HTMLElement;
    if (actionBar) {
      actionBar.style.display = 'none';
    }
  }

  disconnectedCallback() {
    // Called when element is removed from DOM
    // Phase 9: Cleanup refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
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
    this.wireActionBar();
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

  private wireActionBar(): void {
    const saveChatBtn = this.shadow.querySelector('.chatkit-save-chat-btn') as HTMLButtonElement;
    const personalizeBtn = this.shadow.querySelector('.chatkit-personalize-btn') as HTMLButtonElement;
    const logoutBtn = this.shadow.querySelector('.chatkit-logout-btn') as HTMLButtonElement;

    if (!saveChatBtn || !personalizeBtn || !logoutBtn) return;

    // Wire Save Chat button
    saveChatBtn.addEventListener('click', () => {
      this.handleSaveChat();
    });

    // Wire Personalize button
    personalizeBtn.addEventListener('click', () => {
      this.handlePersonalize();
    });

    // Phase 8: Wire Logout button
    logoutBtn.addEventListener('click', async () => {
      await this.handleLogout();
    });
  }

  private async handleLogout(): Promise<void> {
    // Phase 8: Logout functionality
    await this.authClient.logout();
    this.hideActionBar();

    // Phase 9: Clear refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    this.appendMessage('👋 You have been logged out. Chat remains available anonymously.', 'assistant');
  }

  private async handleSaveChat(): Promise<void> {
    // Phase 8: Real Save Chat with API call
    if (this.authClient.isAuthenticated()) {
      // User is authenticated - call save API
      const loadingId = this.appendMessage('Saving chat...', 'assistant', true);

      try {
        const token = this.authClient.getSessionToken();
        const response = await fetch('http://localhost:8000/api/v1/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: this.messages,
            title: `Chat ${new Date().toLocaleString()}`,
          }),
        });

        this.removeMessage(loadingId);

        if (!response.ok) {
          const error = await response.json();
          // Phase 9: Use toast for rate limit errors
          if (response.status === 429) {
            this.showToast(error.error?.message || 'Rate limit exceeded. Please try again later.', 'error');
            return;
          }
          throw new Error(error.error?.message || 'Failed to save chat');
        }

        const data = await response.json();
        this.showToast(`💾 Chat saved successfully! (ID: ${data.chat_id})`, 'success');
      } catch (error: any) {
        this.removeMessage(loadingId);
        this.showToast(error.message || 'Failed to save chat', 'error');
      }
    } else {
      // User not authenticated - open signup modal
      this.authClient.openSignupModal();
      this.showSignupModal();
    }
  }

  private async handlePersonalize(): Promise<void> {
    // Phase 8: Real Personalize with API call
    if (this.authClient.isAuthenticated()) {
      // User is authenticated - call personalize API
      const loadingId = this.appendMessage('Personalizing content...', 'assistant', true);

      try {
        const token = this.authClient.getSessionToken();
        const response = await fetch('http://localhost:8000/api/v1/user/personalize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            preferences: {},
          }),
        });

        this.removeMessage(loadingId);

        if (!response.ok) {
          const error = await response.json();
          // Phase 9: Use toast for rate limit errors
          if (response.status === 429) {
            this.showToast(error.error?.message || 'Rate limit exceeded. Please try again later.', 'error');
            return;
          }
          throw new Error(error.error?.message || 'Failed to personalize');
        }

        const data = await response.json();

        // Show recommendations
        const recsText = `✨ Personalized recommendations:\n${data.recommendations.map((r: string) => `• ${r}`).join('\n')}`;
        this.appendMessage(recsText, 'assistant');
        this.showToast('Personalization applied!', 'success');
      } catch (error: any) {
        this.removeMessage(loadingId);
        this.showToast(error.message || 'Failed to personalize', 'error');
      }
    } else {
      // User not authenticated - open signup modal
      this.authClient.openSignupModal();
      this.showSignupModal();
    }
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

    // Phase 8: Track messages for saving (skip loading messages)
    if (!isLoading) {
      this.messages.push({ role, content });
    }

    return messageId;
  }

  private removeMessage(messageId: string): void {
    const message = this.shadow.getElementById(messageId);
    if (message) {
      message.remove();
    }
  }

  // ===== Phase 9: Toast Notifications =====

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const container = this.shadow.querySelector('.chatkit-toast-container') as HTMLElement;
    if (!container) return;

    const toast = document.createElement('div');
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    toast.id = toastId;
    toast.className = `chatkit-toast chatkit-toast-${type}`;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'chatkit-toast-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    toast.appendChild(messageSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  // ===== Phase 9: Email Verification =====

  private async checkEmailVerification(): Promise<void> {
    try {
      const token = this.authClient.getSessionToken();
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/v1/auth/verification-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      const badge = this.shadow.querySelector('.chatkit-verification-badge') as HTMLElement;

      if (!data.verified && badge) {
        badge.style.display = 'block';
        // Wire resend verification button
        badge.addEventListener('click', () => this.handleResendVerification());
      } else if (badge) {
        badge.style.display = 'none';
      }
    } catch (error) {
      console.error('Failed to check verification status:', error);
    }
  }

  private async handleResendVerification(): Promise<void> {
    try {
      const session = this.authClient.getSession();
      if (!session) return;

      const response = await fetch('http://localhost:8000/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.profile.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend verification email');
      }

      this.showToast('Verification email sent! Check your inbox.', 'success');
    } catch (error: any) {
      this.showToast(error.message || 'Failed to resend verification email', 'error');
    }
  }

  // ===== Phase 9: Session Refresh =====

  private async refreshToken(): Promise<boolean> {
    try {
      const oldToken = this.authClient.getSessionToken();
      if (!oldToken) return false;

      const response = await fetch('http://localhost:8000/api/v1/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oldToken}`,
        },
      });

      if (!response.ok) return false;

      const data = await response.json();

      // Update token in authClient
      this.authClient.updateSessionToken(data.token);

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // ===== Phase 9: Data Migration =====

  private async checkMigration(): Promise<void> {
    // Check if there's an anonymous session to migrate
    const anonId = localStorage.getItem('anon_session_id');
    const anonMessages = localStorage.getItem('anon_messages');

    if (anonId && anonMessages && this.authClient.isAuthenticated()) {
      this.showMigrationPrompt(anonId);
    }
  }

  private showMigrationPrompt(anonId: string): void {
    const prompt = this.shadow.querySelector('.chatkit-migration-prompt') as HTMLElement;
    if (!prompt) return;

    prompt.style.display = 'flex';

    const acceptBtn = this.shadow.querySelector('.chatkit-migration-accept') as HTMLButtonElement;
    const declineBtn = this.shadow.querySelector('.chatkit-migration-decline') as HTMLButtonElement;

    // Wire accept button
    acceptBtn?.addEventListener('click', async () => {
      await this.handleMigration(anonId);
      this.hideMigrationPrompt();
    });

    // Wire decline button
    declineBtn?.addEventListener('click', () => {
      this.clearAnonymousSession();
      this.hideMigrationPrompt();
    });
  }

  private hideMigrationPrompt(): void {
    const prompt = this.shadow.querySelector('.chatkit-migration-prompt') as HTMLElement;
    if (prompt) {
      prompt.style.display = 'none';
    }
  }

  private async handleMigration(anonId: string): Promise<void> {
    try {
      const token = this.authClient.getSessionToken();
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/v1/auth/migrate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          anon_id: anonId,
        }),
      });

      if (!response.ok) {
        throw new Error('Migration failed');
      }

      const data = await response.json();
      this.showToast(`✅ Migrated ${data.migrated_messages} messages to your account!`, 'success');

      // Clear anonymous session
      this.clearAnonymousSession();
    } catch (error: any) {
      this.showToast(error.message || 'Failed to migrate session', 'error');
    }
  }

  private clearAnonymousSession(): void {
    localStorage.removeItem('anon_session_id');
    localStorage.removeItem('anon_messages');
    this.anonSessionId = null;
  }
}

// Register custom element
if (!customElements.get('chatkit-widget')) {
  customElements.define('chatkit-widget', ChatKitWidget);
}
