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
  `;
}
