/**
 * Auth Client Service
 *
 * Integrates with Better-Auth for:
 * - OAuth (Google, GitHub, Microsoft)
 * - Email verification
 * - Session management
 *
 * Implementation placeholder - will follow Better-Auth MCP design.
 */

export class AuthClient {
  constructor() {
    // Initialize client
  }

  async getCurrentTier(): Promise<'anonymous' | 'lightweight' | 'full' | 'premium'> {
    // Placeholder - will implement tier detection
    return 'anonymous';
  }
}
