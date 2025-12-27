/**
 * Shadow DOM HTML Template
 *
 * Defines the internal structure of the ChatKit Widget.
 * Encapsulated via Shadow DOM - isolated from page styles.
 */

export function getTemplate(): string {
  return `
    <div class="chatkit-container">
      <!-- Widget UI will be defined here -->
      <p>ChatKit Widget (Web Component)</p>
    </div>
  `;
}
