/**
 * Shadow DOM HTML Template
 *
 * Defines the internal structure of the ChatKit Widget.
 * Encapsulated via Shadow DOM - isolated from page styles.
 *
 * Phase 7A: Static UI only (no handlers, no state)
 */

export function getTemplate(): string {
  return `
    <div class="chatkit-container">
      <div class="chatkit-header">
        <h3>Chat with Book</h3>
      </div>

      <div class="chatkit-messages">
        <!-- Messages will appear here -->
        <div class="chatkit-placeholder">
          <p>Ask a question about the content...</p>
        </div>
      </div>

      <!-- STEP 3.1: Soft Prompt (inline, non-modal, dismissible) -->
      <div class="chatkit-soft-prompt" style="display: none;">
        <div class="chatkit-soft-prompt-content">
          <button class="chatkit-soft-prompt-close" aria-label="Dismiss">✕</button>
          <p>💡 Want to save your chats? <a href="#" class="chatkit-soft-prompt-cta">Sign up</a> (it's quick!)</p>
        </div>
      </div>

      <!-- Phase 7C-C: Save Chat & Personalize Action Bar -->
      <div class="chatkit-action-bar" style="display: none;">
        <button class="chatkit-save-chat-btn" aria-label="Save this chat" title="Save this conversation">
          💾 Save Chat
        </button>
        <button class="chatkit-personalize-btn" aria-label="Personalize content" title="Get personalized recommendations">
          ✨ Personalize
        </button>
        <button class="chatkit-logout-btn" aria-label="Logout" title="Sign out">
          🚪 Logout
        </button>
      </div>

      <div class="chatkit-input-area">
        <input
          type="text"
          class="chatkit-input"
          placeholder="Type your question..."
          aria-label="Chat input"
        />
        <button class="chatkit-send-btn" aria-label="Send message">
          Send
        </button>
      </div>
    </div>

    <!-- STEP 3.2: Signup Modal (email input, consent checkbox, cancel button) -->
    <div class="chatkit-modal-overlay" style="display: none;">
      <div class="chatkit-modal">
        <div class="chatkit-modal-header">
          <h3>Sign Up</h3>
          <button class="chatkit-modal-close" aria-label="Close">✕</button>
        </div>
        <div class="chatkit-modal-body">
          <p>Create an account to save your chats and unlock personalization.</p>

          <label for="chatkit-email">Email</label>
          <input
            type="email"
            id="chatkit-email"
            class="chatkit-email-input"
            placeholder="your@email.com"
            aria-label="Email address"
          />

          <label class="chatkit-consent-label">
            <input
              type="checkbox"
              id="chatkit-consent"
              class="chatkit-consent-checkbox"
            />
            I consent to data storage (required)
          </label>

          <div class="chatkit-modal-error" style="display: none;"></div>
        </div>
        <div class="chatkit-modal-footer">
          <button class="chatkit-modal-cancel">Cancel</button>
          <button class="chatkit-modal-submit">Sign Up</button>
        </div>
      </div>
    </div>
  `;
}
