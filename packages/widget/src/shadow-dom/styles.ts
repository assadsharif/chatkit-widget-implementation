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

    /* Responsive */
    @media (max-width: 640px) {
      .chatkit-container {
        max-width: 100%;
        height: 400px;
      }
    }
  `;
}
