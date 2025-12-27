# T028 — Auth State Diagram

**Phase**: 5 (Design Only)
**User Story**: US3 - Progressive Signup
**Type**: State Machine Documentation

---

## Purpose

Define all authentication states and transitions. Design-only (no code).

---

## State Machine Diagram (Text Representation)

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION STATES                       │
└─────────────────────────────────────────────────────────────────┘

[1] ANONYMOUS
     │
     ├─ (User asks questions) ────────────────┐
     │                                         │
     ├─ (5th question OR feature click) ──> [2] SOFT_PROMPT_SHOWN
     │                                         │
     │                                         ├─ (User clicks "Sign Up") ──> [3] SIGNUP_MODAL_OPEN
     │                                         │
     │                                         └─ (User dismisses) ──> [1] ANONYMOUS (prompt dismissed)
     │
     ├─ (Feature click: Save/Export) ─────> [3] SIGNUP_MODAL_OPEN
     │
     └─ (Rate limit hit) ──────────────────> [4] RATE_LIMITED
          │
          └─ (60s timeout OR signup) ──────> [1] ANONYMOUS or [3] SIGNUP_MODAL_OPEN


[3] SIGNUP_MODAL_OPEN
     │
     ├─ (User enters email) ──────────────> [5] EMAIL_VERIFICATION_PENDING
     │
     ├─ (User clicks OAuth) ──────────────> [6] OAUTH_IN_PROGRESS
     │
     └─ (User cancels) ───────────────────> [1] ANONYMOUS


[5] EMAIL_VERIFICATION_PENDING
     │
     ├─ (Email verified) ─────────────────> [7] LOGGED_IN
     │
     ├─ (Verification timeout) ───────────> [8] VERIFICATION_FAILED
     │                                         │
     │                                         └─ (Retry) ──> [5] EMAIL_VERIFICATION_PENDING
     │
     └─ (User cancels) ───────────────────> [1] ANONYMOUS


[6] OAUTH_IN_PROGRESS
     │
     ├─ (OAuth success) ──────────────────> [7] LOGGED_IN
     │
     ├─ (OAuth denied/error) ─────────────> [9] OAUTH_FAILED
     │                                         │
     │                                         └─ (Retry) ──> [3] SIGNUP_MODAL_OPEN
     │
     └─ (User closes OAuth window) ───────> [1] ANONYMOUS


[7] LOGGED_IN
     │
     ├─ (Session valid) ──────────────────> [7] LOGGED_IN (active session)
     │
     ├─ (User logs out) ──────────────────> [1] ANONYMOUS (session cleared)
     │
     └─ (Session expired) ────────────────> [10] SESSION_EXPIRED
          │
          └─ (User re-authenticates) ─────> [7] LOGGED_IN


[4] RATE_LIMITED
     │
     ├─ (60s timeout) ────────────────────> [1] ANONYMOUS (limit reset)
     │
     └─ (User signs up) ──────────────────> [3] SIGNUP_MODAL_OPEN


[8] VERIFICATION_FAILED
     │
     ├─ (Retry) ──────────────────────────> [5] EMAIL_VERIFICATION_PENDING
     │
     └─ (Cancel) ─────────────────────────> [1] ANONYMOUS


[9] OAUTH_FAILED
     │
     ├─ (Retry with different provider) ──> [3] SIGNUP_MODAL_OPEN
     │
     └─ (Cancel) ─────────────────────────> [1] ANONYMOUS


[10] SESSION_EXPIRED
     │
     ├─ (Re-login) ───────────────────────> [7] LOGGED_IN
     │
     └─ (Continue as anonymous) ──────────> [1] ANONYMOUS
```

---

## State Definitions

### State 1: ANONYMOUS

**Description**: User has NOT authenticated

**Characteristics**:
- Session ID: UUID v4 (memory only)
- Storage: None (or browser-local only)
- Features: Basic chat + RAG
- Rate Limit: 10/min, 500/day

**Entry Conditions**:
- Widget first loads
- User logs out
- User cancels signup
- Session expired + user continues anonymously

**Exit Conditions**:
- User triggers signup prompt
- User clicks feature requiring auth
- Rate limit exceeded

---

### State 2: SOFT_PROMPT_SHOWN

**Description**: Non-blocking signup hint displayed

**Characteristics**:
- Same as ANONYMOUS, plus hint visible
- Hint is dismissible
- Chat remains fully functional

**Entry Conditions**:
- 5th question asked
- 10 minutes of active usage
- 3rd page refresh

**Exit Conditions**:
- User clicks "Sign Up" → SIGNUP_MODAL_OPEN
- User dismisses → ANONYMOUS (flag: prompt_dismissed = true)

---

### State 3: SIGNUP_MODAL_OPEN

**Description**: Signup/login modal is active

**Characteristics**:
- Modal overlay active
- Chat visible in background (if design allows)
- User must interact with modal or cancel

**Entry Conditions**:
- User clicks "Sign Up" from SOFT_PROMPT_SHOWN
- User clicks "Save Chat" or feature requiring auth
- Rate limit exceeded + user chooses signup

**Exit Conditions**:
- User enters email → EMAIL_VERIFICATION_PENDING
- User clicks OAuth → OAUTH_IN_PROGRESS
- User cancels → ANONYMOUS

---

### State 4: RATE_LIMITED

**Description**: User exceeded rate limit

**Characteristics**:
- Chat input disabled (or message blocked)
- Countdown timer visible
- Signup CTA prominent

**Entry Conditions**:
- 10 messages in 60 seconds
- 500 messages in 24 hours

**Exit Conditions**:
- Timeout expires → ANONYMOUS (limit reset)
- User signs up → SIGNUP_MODAL_OPEN

---

### State 5: EMAIL_VERIFICATION_PENDING

**Description**: Email sent, awaiting verification

**Characteristics**:
- Modal shows "Check your email" message
- User can resend email
- Polling backend for verification status

**Entry Conditions**:
- User enters email + clicks "Sign Up with Email"

**Exit Conditions**:
- Email verified (user clicks link) → LOGGED_IN
- Verification timeout (10 minutes) → VERIFICATION_FAILED
- User cancels → ANONYMOUS

---

### State 6: OAUTH_IN_PROGRESS

**Description**: OAuth flow active (Google/GitHub/etc.)

**Characteristics**:
- OAuth popup/redirect opened
- Widget polls for OAuth callback
- User can close OAuth window

**Entry Conditions**:
- User clicks "Sign Up with Google" (or GitHub, etc.)

**Exit Conditions**:
- OAuth success → LOGGED_IN
- OAuth denied/error → OAUTH_FAILED
- User closes OAuth window → ANONYMOUS

---

### State 7: LOGGED_IN

**Description**: User authenticated successfully

**Characteristics**:
- Session token stored (localStorage + server)
- Full features unlocked
- No rate limits (or higher limits)
- User profile available

**Entry Conditions**:
- Email verification complete
- OAuth success
- Re-login from SESSION_EXPIRED

**Exit Conditions**:
- User logs out → ANONYMOUS
- Session expires (30 days) → SESSION_EXPIRED

---

### State 8: VERIFICATION_FAILED

**Description**: Email verification failed/timed out

**Characteristics**:
- Error message shown
- Retry option available
- Cancel option available

**Entry Conditions**:
- Email verification timeout (10 minutes)
- Verification link expired

**Exit Conditions**:
- User clicks "Resend Email" → EMAIL_VERIFICATION_PENDING
- User cancels → ANONYMOUS

---

### State 9: OAUTH_FAILED

**Description**: OAuth flow failed

**Characteristics**:
- Error message shown
- Option to try different provider
- Option to use email instead

**Entry Conditions**:
- OAuth denied by user
- OAuth server error
- Network error during OAuth

**Exit Conditions**:
- User tries different provider → SIGNUP_MODAL_OPEN
- User cancels → ANONYMOUS

---

### State 10: SESSION_EXPIRED

**Description**: User was logged in, session expired

**Characteristics**:
- Banner: "Your session expired. Re-login to save your work."
- Chat continues in ANONYMOUS mode
- User can re-login

**Entry Conditions**:
- Session token expired (30 days)
- Session invalidated (logout from different device)

**Exit Conditions**:
- User re-logins → LOGGED_IN
- User continues → ANONYMOUS

---

## State Transition Table

| Current State | Event | Next State | Notes |
|---------------|-------|------------|-------|
| ANONYMOUS | 5th question | SOFT_PROMPT_SHOWN | Non-blocking |
| SOFT_PROMPT_SHOWN | Click "Sign Up" | SIGNUP_MODAL_OPEN | User intent |
| SOFT_PROMPT_SHOWN | Dismiss | ANONYMOUS | Respectful |
| SIGNUP_MODAL_OPEN | Enter email | EMAIL_VERIFICATION_PENDING | Email flow |
| SIGNUP_MODAL_OPEN | Click OAuth | OAUTH_IN_PROGRESS | OAuth flow |
| SIGNUP_MODAL_OPEN | Cancel | ANONYMOUS | Escape path |
| EMAIL_VERIFICATION_PENDING | Email verified | LOGGED_IN | Success |
| EMAIL_VERIFICATION_PENDING | Timeout | VERIFICATION_FAILED | Error recovery |
| OAUTH_IN_PROGRESS | OAuth success | LOGGED_IN | Success |
| OAUTH_IN_PROGRESS | OAuth error | OAUTH_FAILED | Error recovery |
| LOGGED_IN | Logout | ANONYMOUS | Explicit logout |
| LOGGED_IN | Session expires | SESSION_EXPIRED | Timeout |
| RATE_LIMITED | Timeout | ANONYMOUS | Limit reset |
| RATE_LIMITED | Sign up | SIGNUP_MODAL_OPEN | Bypass limit |

---

## Cancel Paths (Always Available)

**Every modal state has escape path**:
- SIGNUP_MODAL_OPEN → Cancel → ANONYMOUS
- EMAIL_VERIFICATION_PENDING → Cancel → ANONYMOUS
- OAUTH_IN_PROGRESS → Close window → ANONYMOUS

**Design Principle**: User must NEVER feel trapped.

---

## Retry Paths

**Error states allow retry**:
- VERIFICATION_FAILED → Retry → EMAIL_VERIFICATION_PENDING
- OAUTH_FAILED → Retry → SIGNUP_MODAL_OPEN
- SESSION_EXPIRED → Re-login → LOGGED_IN

---

## Fallback Paths

**Degradation strategy**:
- If signup fails: User continues as ANONYMOUS
- If session expires: Chat continues in ANONYMOUS mode
- If OAuth unavailable: Email signup offered

---

## State Persistence

**Storage Strategy** (design, not implementation):

| State | Storage Location | Duration |
|-------|------------------|----------|
| ANONYMOUS | Memory only | Session (tab close = lost) |
| LOGGED_IN | localStorage + backend | 30 days |
| SESSION_EXPIRED | localStorage (flag) | Until re-login |
| Rate limit counters | localStorage | 24 hours |

---

## Accessibility Requirements

**All states must support**:
- Screen reader announcements on state changes
- Keyboard navigation between states
- Focus management (modal open = focus trap)
- Esc key to cancel/go back

---

## Security Considerations

**State Validation**:
- LOGGED_IN state must verify session token with backend
- OAuth tokens must be validated
- Email verification links must expire after 10 minutes
- Rate limit state cannot be bypassed client-side

---

## Testing States (Future)

**Each state must have test cases**:
- Happy path (state → event → expected next state)
- Error path (state → error → fallback state)
- Cancel path (state → cancel → ANONYMOUS)
- Edge cases (concurrent events, race conditions)

---

## Next Steps

- T029: Data ownership rules (what data belongs to which state)
- T030: Consent timing rules (when to ask for data permissions)
- T031: Abuse prevention rules (rate limiting, spam detection)

---

**Last Updated**: 2025-12-27
**Status**: ✅ Design Complete (No Implementation)
