/**
 * Auth Client Service
 *
 * Email-based authentication (Tier-1 only, no OAuth yet).
 * Implements Phase 5 design: anonymous-first, value-first, non-blocking.
 *
 * Design Reference: docs/design/T028-auth-state-diagram.md
 */

// Auth state types (from Phase 5 design)
export type AuthState =
  | 'ANONYMOUS'
  | 'SOFT_PROMPT_SHOWN'
  | 'SIGNUP_MODAL_OPEN'
  | 'EMAIL_VERIFICATION_PENDING'
  | 'LOGGED_IN'
  | 'VERIFICATION_FAILED'
  | 'SESSION_EXPIRED';

// User profile (minimal for Tier-1)
export interface UserProfile {
  user_id: string;
  email: string;
  created_at: string;
  tier: 'lightweight' | 'full' | 'premium'; // No 'anonymous' (not a logged-in tier)
}

// Signup request
export interface SignupRequest {
  email: string;
  consent_data_storage: boolean; // GDPR requirement
  migrate_session?: boolean; // Optional: migrate anonymous session
}

// Signup response (matches backend contract)
export interface SignupResponse {
  status: 'verification_sent';
}

// Verification request
export interface VerifyEmailRequest {
  token: string; // From email link
}

// Verification response
export interface VerifyEmailResponse {
  success: boolean;
  user: UserProfile;
  session_token: string;
}

// Auth error
export class AuthClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthClientError';
  }
}

/**
 * Auth Client
 *
 * Handles authentication flow following Phase 5 design rules:
 * - Anonymous-first (no forced signup)
 * - Value-first (signup after value delivered)
 * - Non-blocking (always escape path)
 */
export class AuthClient {
  private baseURL: string;
  private currentState: AuthState = 'ANONYMOUS';
  private sessionToken: string | null = null;
  private userProfile: UserProfile | null = null;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.loadSessionFromStorage();
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return this.currentState;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentState === 'LOGGED_IN' && this.sessionToken !== null;
  }

  /**
   * Get user profile (if logged in)
   */
  getProfile(): UserProfile | null {
    return this.userProfile;
  }

  /**
   * Get current tier (anonymous or logged-in tier)
   */
  async getCurrentTier(): Promise<'anonymous' | 'lightweight' | 'full' | 'premium'> {
    if (this.isLoggedIn() && this.userProfile) {
      return this.userProfile.tier;
    }
    return 'anonymous';
  }

  /**
   * Sign up with email (Tier-1)
   *
   * Phase 5 Rule: Requires explicit consent
   */
  async signup(request: SignupRequest): Promise<SignupResponse> {
    // Validate email
    if (!this.isValidEmail(request.email)) {
      throw new AuthClientError('INVALID_EMAIL', 'Please enter a valid email address');
    }

    // Validate consent (GDPR requirement)
    if (!request.consent_data_storage) {
      throw new AuthClientError(
        'CONSENT_REQUIRED',
        'You must consent to data storage to create an account'
      );
    }

    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data: SignupResponse = await response.json();

      // Update state
      if (data.status === 'verification_sent') {
        this.currentState = 'EMAIL_VERIFICATION_PENDING';
      }

      return data;
    } catch (error) {
      if (error instanceof AuthClientError) {
        throw error;
      }
      throw new AuthClientError('NETWORK_ERROR', 'Failed to connect to auth service');
    }
  }

  /**
   * Verify email with token (from email link)
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data: VerifyEmailResponse = await response.json();

      if (data.success) {
        // Store session
        this.sessionToken = data.session_token;
        this.userProfile = data.user;
        this.currentState = 'LOGGED_IN';
        this.saveSessionToStorage();
      } else {
        this.currentState = 'VERIFICATION_FAILED';
      }

      return data;
    } catch (error) {
      this.currentState = 'VERIFICATION_FAILED';
      if (error instanceof AuthClientError) {
        throw error;
      }
      throw new AuthClientError('VERIFICATION_ERROR', 'Failed to verify email');
    }
  }

  /**
   * Log out (clear session)
   *
   * Phase 5 Rule: Always allow logout
   */
  async logout(): Promise<void> {
    this.sessionToken = null;
    this.userProfile = null;
    this.currentState = 'ANONYMOUS';
    this.clearSessionFromStorage();
  }

  /**
   * Transition to soft prompt state
   *
   * Phase 5 Rule: Non-blocking, dismissible
   */
  showSoftPrompt(): void {
    if (this.currentState === 'ANONYMOUS') {
      this.currentState = 'SOFT_PROMPT_SHOWN';
    }
  }

  /**
   * Dismiss soft prompt (user declined)
   *
   * Phase 5 Rule: Respect dismissals
   */
  dismissSoftPrompt(): void {
    if (this.currentState === 'SOFT_PROMPT_SHOWN') {
      this.currentState = 'ANONYMOUS';
      // Store dismissal flag (prevent re-showing this session)
      sessionStorage.setItem('signup_hint_dismissed', 'true');
    }
  }

  /**
   * Check if soft prompt was dismissed
   */
  wasSoftPromptDismissed(): boolean {
    return sessionStorage.getItem('signup_hint_dismissed') === 'true';
  }

  /**
   * Open signup modal
   *
   * Phase 5 Rule: User-initiated (feature click or soft prompt click)
   */
  openSignupModal(): void {
    this.currentState = 'SIGNUP_MODAL_OPEN';
  }

  /**
   * Close signup modal (user canceled)
   *
   * Phase 5 Rule: Always escape path
   */
  closeSignupModal(): void {
    if (
      this.currentState === 'SIGNUP_MODAL_OPEN' ||
      this.currentState === 'EMAIL_VERIFICATION_PENDING' ||
      this.currentState === 'VERIFICATION_FAILED'
    ) {
      this.currentState = 'ANONYMOUS';
    }
  }

  /**
   * Get session token (for authenticated API calls)
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Load session from localStorage
   *
   * Phase 5 Rule: Session persists across page refreshes (if logged in)
   */
  private loadSessionFromStorage(): void {
    try {
      const token = localStorage.getItem('session_token');
      const profileData = localStorage.getItem('user_profile');

      if (token && profileData) {
        this.sessionToken = token;
        this.userProfile = JSON.parse(profileData);
        this.currentState = 'LOGGED_IN';
      }
    } catch (error) {
      // Ignore errors, start as anonymous
      this.clearSessionFromStorage();
    }
  }

  /**
   * Save session to localStorage
   */
  private saveSessionToStorage(): void {
    if (this.sessionToken && this.userProfile) {
      localStorage.setItem('session_token', this.sessionToken);
      localStorage.setItem('user_profile', JSON.stringify(this.userProfile));
    }
  }

  /**
   * Clear session from localStorage
   */
  private clearSessionFromStorage(): void {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_profile');
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: { error: { code: string; message: string } };

    try {
      errorData = await response.json();
    } catch {
      throw new AuthClientError(
        'UNKNOWN_ERROR',
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const error = errorData.error;
    throw new AuthClientError(error.code, error.message);
  }
}
