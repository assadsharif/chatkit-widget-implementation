/**
 * Scoped Styles for ChatKit Widget
 *
 * These styles are encapsulated within Shadow DOM.
 * They do not leak to the host page, and host page styles do not leak in.
 *
 * Phase 7A: Basic styling with CSS variables
 */

export function getStyles(): string {
  return `
    :host {
      /* CSS Variables for theming */
      --chatkit-primary: #2563eb;
      --chatkit-bg: #ffffff;
      --chatkit-text: #1f2937;
      --chatkit-border: #e5e7eb;
      --chatkit-input-bg: #f9fafb;
      --chatkit-placeholder-bg: #f3f4f6;

      display: block;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .chatkit-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 600px;
      height: 500px;
      background: var(--chatkit-bg);
      border: 1px solid var(--chatkit-border);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .chatkit-header {
      padding: 16px;
      background: var(--chatkit-primary);
      color: white;
      border-bottom: 1px solid var(--chatkit-border);
    }

    .chatkit-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .chatkit-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: var(--chatkit-bg);
    }

    .chatkit-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: var(--chatkit-placeholder-bg);
      border-radius: 8px;
      color: #6b7280;
    }

    .chatkit-placeholder p {
      margin: 0;
      font-size: 14px;
    }

    /* Message styling (Phase 7A-2) */
    .chatkit-message {
      margin-bottom: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
      max-width: 80%;
      word-wrap: break-word;
    }

    .chatkit-message-user {
      background: var(--chatkit-primary);
      color: white;
      margin-left: auto;
      text-align: right;
    }

    .chatkit-message-assistant {
      background: var(--chatkit-input-bg);
      color: var(--chatkit-text);
      margin-right: auto;
    }

    .chatkit-input-area {
      display: flex;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid var(--chatkit-border);
      background: var(--chatkit-bg);
    }

    .chatkit-input {
      flex: 1;
      padding: 10px 12px;
      font-size: 14px;
      border: 1px solid var(--chatkit-border);
      border-radius: 6px;
      background: var(--chatkit-input-bg);
      color: var(--chatkit-text);
      outline: none;
      transition: border-color 0.2s;
    }

    .chatkit-input:focus {
      border-color: var(--chatkit-primary);
    }

    .chatkit-send-btn {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      background: var(--chatkit-primary);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .chatkit-send-btn:hover {
      opacity: 0.9;
    }

    .chatkit-send-btn:active {
      opacity: 0.8;
    }

    /* Loading state */
    .chatkit-message-loading {
      opacity: 0.7;
      font-style: italic;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .chatkit-container {
        max-width: 100%;
        height: 400px;
      }
    }

    /* STEP 3.1: Soft Prompt (inline, non-modal, dismissible) */
    .chatkit-soft-prompt {
      padding: 12px 16px;
      background: #fef3c7;
      border-top: 1px solid #fbbf24;
      font-size: 14px;
      position: relative;
    }

    .chatkit-soft-prompt-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chatkit-soft-prompt-content p {
      margin: 0;
      flex: 1;
      color: #78350f;
    }

    .chatkit-soft-prompt-cta {
      color: var(--chatkit-primary);
      text-decoration: underline;
      cursor: pointer;
      font-weight: 500;
    }

    .chatkit-soft-prompt-cta:hover {
      opacity: 0.8;
    }

    .chatkit-soft-prompt-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #78350f;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .chatkit-soft-prompt-close:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    /* STEP 3.2: Signup Modal */
    .chatkit-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .chatkit-modal {
      background: var(--chatkit-bg);
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
      max-height: 90vh;
      overflow: auto;
    }

    .chatkit-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--chatkit-border);
    }

    .chatkit-modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--chatkit-text);
    }

    .chatkit-modal-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .chatkit-modal-close:hover {
      background: var(--chatkit-input-bg);
    }

    .chatkit-modal-body {
      padding: 20px;
    }

    .chatkit-modal-body p {
      margin: 0 0 16px;
      font-size: 14px;
      color: #6b7280;
    }

    .chatkit-modal-body label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
      color: var(--chatkit-text);
    }

    .chatkit-email-input {
      width: 100%;
      padding: 10px 12px;
      font-size: 14px;
      border: 1px solid var(--chatkit-border);
      border-radius: 6px;
      background: var(--chatkit-input-bg);
      color: var(--chatkit-text);
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
      margin-bottom: 16px;
    }

    .chatkit-email-input:focus {
      border-color: var(--chatkit-primary);
    }

    .chatkit-consent-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: normal;
      color: var(--chatkit-text);
      cursor: pointer;
      margin-bottom: 0;
    }

    .chatkit-consent-checkbox {
      cursor: pointer;
    }

    .chatkit-modal-error {
      padding: 10px 12px;
      background: #fee2e2;
      border: 1px solid #ef4444;
      border-radius: 6px;
      color: #991b1b;
      font-size: 13px;
      margin-top: 12px;
    }

    .chatkit-modal-footer {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--chatkit-border);
      justify-content: flex-end;
    }

    .chatkit-modal-cancel {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      color: var(--chatkit-text);
      background: var(--chatkit-input-bg);
      border: 1px solid var(--chatkit-border);
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .chatkit-modal-cancel:hover {
      background: #e5e7eb;
    }

    .chatkit-modal-submit {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      background: var(--chatkit-primary);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .chatkit-modal-submit:hover {
      opacity: 0.9;
    }

    .chatkit-modal-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
}
