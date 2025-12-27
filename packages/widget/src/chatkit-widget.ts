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
}

// Register custom element
if (!customElements.get('chatkit-widget')) {
  customElements.define('chatkit-widget', ChatKitWidget);
}
