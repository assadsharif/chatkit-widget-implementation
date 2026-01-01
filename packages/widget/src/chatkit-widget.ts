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
import { fetchWithRequestId } from './utils/http.js'; // Phase 13A: Request tracing

export class ChatKitWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private ragClient: RAGClient;
  private authClient: AuthClient;
  private sessionId: string;
  private questionCount: number = 0;
  private messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private anonSessionId: string | null = null;
  private refreshInterval: number | null = null;
  private analyticsBaseURL: string = 'http://localhost:8000';
  private rateLimitCooldowns: Map<string, number> = new Map(); // action → end timestamp

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

    // Phase 12 (11C): HTTPS assumption guard - enforce HTTPS in production
    this.enforceHTTPS();

    this.render();
    this.wireEvents();
    this.initSession();

    // Phase 10: Track widget load
    this.trackEvent('widget_loaded', {
      session_id: this.sessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Phase 12 (11C): HTTPS Assumption Guard
   *
   * Enforces HTTPS in production to prevent token interception.
   * - Production (non-localhost): Refuses to initialize if not HTTPS
   * - Development (localhost): Warns but allows HTTP
   */
  private enforceHTTPS(): void {
    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]';

    if (!isHTTPS && !isLocalhost) {
      // Production mode: Refuse to initialize
      const errorMsg =
        '🔒 SECURITY ERROR: ChatKit widget requires HTTPS in production. Refusing to initialize.';
      console.error(errorMsg);
      console.error(
        'Current protocol:',
        window.location.protocol,
        'Hostname:',
        window.location.hostname
      );

      // Show error in widget UI
      if (this.shadow) {
        const errorHTML = `
          <style>
            .chatkit-https-error {
              padding: 20px;
              background: #fee;
              border: 2px solid #c00;
              border-radius: 8px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .chatkit-https-error h3 {
              color: #c00;
              margin: 0 0 10px 0;
              font-size: 16px;
            }
            .chatkit-https-error p {
              margin: 0 0 8px 0;
              color: #333;
              font-size: 14px;
              line-height: 1.5;
            }
            .chatkit-https-error code {
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              font-size: 13px;
            }
          </style>
          <div class="chatkit-https-error">
            <h3>🔒 Security Error</h3>
            <p>This widget requires HTTPS to protect your data.</p>
            <p><strong>Current:</strong> <code>${window.location.protocol}//${window.location.hostname}</code></p>
            <p><strong>Required:</strong> <code>https://${window.location.hostname}</code></p>
            <p>Please enable HTTPS on your site or use localhost for development.</p>
          </div>
        `;
        this.shadow.innerHTML = errorHTML;
      }

      // Throw error to prevent further initialization
      throw new Error(errorMsg);
    } else if (!isHTTPS && isLocalhost) {
      // Development mode: Warn but allow
      console.warn(
        '⚠️  WARNING: ChatKit widget running over HTTP on localhost. ' +
          'This is only safe for development. Use HTTPS in production.'
      );
    } else {
      // HTTPS in production or localhost - all good
      console.log('✅ HTTPS check passed:', window.location.protocol);
    }
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

      // Phase 10: Check if token needs immediate refresh (on page reload)
      await this.checkAndRefreshIfNeeded();

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

      // Phase 10: Track chat message
      this.trackEvent('chat_message', {
        message_length: e.detail.message.length,
        question_count: this.questionCount + 1,
      });

      // STEP 2: Widget Trigger - 5th question (ONLY THIS)
      // Increment question count
      this.questionCount++;

      // Trigger soft prompt on 5th question (if not dismissed)
      if (this.questionCount === 5 && !this.authClient.wasSoftPromptDismissed()) {
        this.authClient.showSoftPrompt();
        this.showSoftPrompt();
        // Phase 10: Track soft prompt shown
        this.trackEvent('soft_prompt_shown', { trigger: '5th_question' });
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
      // Phase 10: Track soft prompt dismissed
      this.trackEvent('soft_prompt_dismissed');
    });

    // Wire CTA link (open signup modal)
    ctaLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.authClient.openSignupModal();
      this.hideSoftPrompt();
      this.showSignupModal();
      // Phase 10: Track signup modal opened
      this.trackEvent('signup_modal_opened', { source: 'soft_prompt' });
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
      // Phase 10: Track modal closed
      this.trackEvent('signup_modal_closed', { method: 'close_button' });
    });

    // Wire cancel button
    modalCancel.addEventListener('click', () => {
      this.authClient.closeSignupModal();
      this.hideSignupModal();
      this.clearSignupForm();
      // Phase 10: Track modal closed
      this.trackEvent('signup_modal_closed', { method: 'cancel_button' });
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

    // Phase 10: Track logout
    this.trackEvent('logout');
  }

  private async handleSaveChat(): Promise<void> {
    // Phase 10: Check rate limit before proceeding
    if (this.isRateLimited('save_chat')) {
      const remainingSeconds = this.getRateLimitRemaining('save_chat');
      this.showRateLimitToast(remainingSeconds);
      return;
    }

    // Phase 8: Real Save Chat with API call
    if (this.authClient.isAuthenticated()) {
      // User is authenticated - call save API
      const loadingId = this.appendMessage('Saving chat...', 'assistant', true);

      try {
        const token = this.authClient.getSessionToken();
        // Phase 13A: Use fetchWithRequestId for automatic request ID injection
        const response = await fetchWithRequestId('http://localhost:8000/api/v1/chat/save', {
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
          // Phase 11B: Backend-driven rate limiting (read retry_after from response)
          if (response.status === 429) {
            const retryAfter = error.retry_after || 60; // Fallback to 60s if missing
            this.setRateLimitCooldown('save_chat', retryAfter);
            this.showRateLimitToast(retryAfter);
            this.updateButtonStates();
            return;
          }
          throw new Error(error.error?.message || 'Failed to save chat');
        }

        const data = await response.json();
        this.showToast(`💾 Chat saved successfully! (ID: ${data.chat_id})`, 'success');
        // Phase 10: Track save chat success
        this.trackEvent('save_chat', { chat_id: data.chat_id, message_count: this.messages.length });
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
    // Phase 10: Check rate limit before proceeding
    if (this.isRateLimited('personalize')) {
      const remainingSeconds = this.getRateLimitRemaining('personalize');
      this.showRateLimitToast(remainingSeconds);
      return;
    }

    // Phase 8: Real Personalize with API call
    if (this.authClient.isAuthenticated()) {
      // User is authenticated - call personalize API
      const loadingId = this.appendMessage('Personalizing content...', 'assistant', true);

      try {
        const token = this.authClient.getSessionToken();
        // Phase 13A: Use fetchWithRequestId for automatic request ID injection
        const response = await fetchWithRequestId('http://localhost:8000/api/v1/user/personalize', {
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
          // Phase 11B: Backend-driven rate limiting (read retry_after from response)
          if (response.status === 429) {
            const retryAfter = error.retry_after || 60; // Fallback to 60s if missing
            this.setRateLimitCooldown('personalize', retryAfter);
            this.showRateLimitToast(retryAfter);
            this.updateButtonStates();
            return;
          }
          throw new Error(error.error?.message || 'Failed to personalize');
        }

        const data = await response.json();

        // Show recommendations
        const recsText = `✨ Personalized recommendations:\n${data.recommendations.map((r: string) => `• ${r}`).join('\n')}`;
        this.appendMessage(recsText, 'assistant');
        this.showToast('Personalization applied!', 'success');
        // Phase 10: Track personalize success
        this.trackEvent('personalize', { recommendation_count: data.recommendations.length });
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
        // Phase 10: Track signup initiated
        this.trackEvent('signup_initiated', { email_domain: email.split('@')[1] });
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

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 5000): void {
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

    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, duration);
  }

  private showRateLimitToast(secondsRemaining: number): void {
    /**
     * Phase 10: Rate limit toast with countdown timer.
     *
     * Shows "Rate limit exceeded. Try again in X seconds" with live countdown.
     */
    const container = this.shadow.querySelector('.chatkit-toast-container') as HTMLElement;
    if (!container) return;

    const toast = document.createElement('div');
    const toastId = `toast-ratelimit-${Date.now()}`;
    toast.id = toastId;
    toast.className = 'chatkit-toast chatkit-toast-error';

    const messageSpan = document.createElement('span');
    messageSpan.textContent = `⏱️ Rate limit exceeded. Try again in ${secondsRemaining}s`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'chatkit-toast-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    toast.appendChild(messageSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    // Countdown timer
    let remaining = secondsRemaining;
    const countdown = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        messageSpan.textContent = `⏱️ Rate limit exceeded. Try again in ${remaining}s`;
      } else {
        messageSpan.textContent = '✅ You can try again now!';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 2000);
        clearInterval(countdown);
      }
    }, 1000);

    // Auto-remove after countdown completes
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
      clearInterval(countdown);
    }, (secondsRemaining + 2) * 1000);
  }

  // ===== Phase 9: Email Verification =====

  private async checkEmailVerification(): Promise<void> {
    try {
      const token = this.authClient.getSessionToken();
      if (!token) return;

      // Phase 13A: Use fetchWithRequestId for automatic request ID injection
      const response = await fetchWithRequestId('http://localhost:8000/api/v1/auth/verification-status', {
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

      // Phase 13A: Use fetchWithRequestId for automatic request ID injection
      const response = await fetchWithRequestId('http://localhost:8000/api/v1/auth/resend-verification', {
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

  private async checkAndRefreshIfNeeded(): Promise<void> {
    /**
     * Phase 10: Check if token needs refreshing after page reload.
     *
     * Refreshes token if last refresh was more than 4 minutes ago.
     * This ensures smooth experience across page reloads.
     */
    const lastRefresh = localStorage.getItem('last_token_refresh');
    if (!lastRefresh) {
      // First time - store current timestamp
      localStorage.setItem('last_token_refresh', Date.now().toString());
      return;
    }

    const lastRefreshTime = parseInt(lastRefresh, 10);
    const timeSinceRefresh = Date.now() - lastRefreshTime;
    const fourMinutes = 4 * 60 * 1000;

    if (timeSinceRefresh > fourMinutes) {
      // Token is stale - refresh it
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        // Refresh failed - logout
        await this.handleLogout();
      }
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const oldToken = this.authClient.getSessionToken();
      if (!oldToken) return false;

      // Phase 13A: Use fetchWithRequestId for automatic request ID injection
      const response = await fetchWithRequestId('http://localhost:8000/api/v1/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oldToken}`,
        },
      });

      if (!response.ok) return false;

      const data = await response.json();

      // Update token in authClient
      this.authClient.updateSessionToken(data.token);

      // Phase 10: Store refresh timestamp
      localStorage.setItem('last_token_refresh', Date.now().toString());

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

      // Phase 13A: Use fetchWithRequestId for automatic request ID injection
      const response = await fetchWithRequestId('http://localhost:8000/api/v1/auth/migrate-session', {
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

  // ===== Phase 10: Analytics Tracking =====

  private async trackEvent(eventType: string, eventData?: Record<string, any>): Promise<void> {
    /**
     * Track analytics event to backend.
     *
     * Sends event to POST /api/v1/analytics/event.
     * Works for both authenticated and anonymous users.
     */
    try {
      const token = this.authClient.getSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Phase 13A: Use fetchWithRequestId for automatic request ID injection
      await fetchWithRequestId(`${this.analyticsBaseURL}/api/v1/analytics/event`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event_type: eventType,
          event_data: eventData || {},
        }),
      });

      // Fire and forget - don't block UI on analytics
    } catch (error) {
      // Silently fail - analytics should never break UX
      console.debug('Analytics event failed:', eventType, error);
    }
  }

  // ===== Phase 10: Rate Limit Feedback =====

  private isRateLimited(action: string): boolean {
    /**
     * Check if action is currently rate-limited.
     */
    const cooldownEnd = this.rateLimitCooldowns.get(action);
    if (!cooldownEnd) return false;

    const now = Date.now();
    if (now >= cooldownEnd) {
      // Cooldown expired - clear it
      this.rateLimitCooldowns.delete(action);
      this.updateButtonStates();
      return false;
    }

    return true;
  }

  private getRateLimitRemaining(action: string): number {
    /**
     * Get remaining seconds for rate limit cooldown.
     */
    const cooldownEnd = this.rateLimitCooldowns.get(action);
    if (!cooldownEnd) return 0;

    const now = Date.now();
    const remaining = Math.ceil((cooldownEnd - now) / 1000);
    return Math.max(0, remaining);
  }

  private setRateLimitCooldown(action: string, seconds: number): void {
    /**
     * Set rate limit cooldown for an action.
     */
    const cooldownEnd = Date.now() + (seconds * 1000);
    this.rateLimitCooldowns.set(action, cooldownEnd);

    // Auto-clear after cooldown
    setTimeout(() => {
      this.rateLimitCooldowns.delete(action);
      this.updateButtonStates();
    }, seconds * 1000);
  }

  private updateButtonStates(): void {
    /**
     * Update button disabled states based on rate limits.
     */
    const saveChatBtn = this.shadow.querySelector('.chatkit-save-chat-btn') as HTMLButtonElement;
    const personalizeBtn = this.shadow.querySelector('.chatkit-personalize-btn') as HTMLButtonElement;

    if (saveChatBtn) {
      const isLimited = this.isRateLimited('save_chat');
      saveChatBtn.disabled = isLimited;
      saveChatBtn.style.opacity = isLimited ? '0.5' : '1';
      saveChatBtn.style.cursor = isLimited ? 'not-allowed' : 'pointer';

      if (isLimited) {
        const remaining = this.getRateLimitRemaining('save_chat');
        saveChatBtn.title = `Rate limited. Try again in ${remaining}s`;
      } else {
        saveChatBtn.title = 'Save this conversation';
      }
    }

    if (personalizeBtn) {
      const isLimited = this.isRateLimited('personalize');
      personalizeBtn.disabled = isLimited;
      personalizeBtn.style.opacity = isLimited ? '0.5' : '1';
      personalizeBtn.style.cursor = isLimited ? 'not-allowed' : 'pointer';

      if (isLimited) {
        const remaining = this.getRateLimitRemaining('personalize');
        personalizeBtn.title = `Rate limited. Try again in ${remaining}s`;
      } else {
        personalizeBtn.title = 'Get personalized recommendations';
      }
    }
  }
}

// Register custom element
if (!customElements.get('chatkit-widget')) {
  customElements.define('chatkit-widget', ChatKitWidget);
}
