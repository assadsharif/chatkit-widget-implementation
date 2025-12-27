# T026 — Progressive Disclosure Triggers

**Phase**: 5 (Design Only)
**User Story**: US3 - Progressive Signup
**Type**: Trigger Rules Documentation

---

## Purpose

Define WHEN and HOW signup prompts appear. Rules-based, no UI implementation.

**Philosophy**: Trigger AFTER value delivered, not before.

---

## Trigger Matrix

| # | Trigger Event | UX Action | Timing | Dismissible | Blocking |
|---|---------------|-----------|--------|-------------|----------|
| 1 | 5th question asked | Soft hint below answer | After answer displays | ✅ Yes | ❌ No |
| 2 | "Save Chat" clicked | Signup modal | Immediately | ✅ Yes | ✅ Yes (feature) |
| 3 | "Personalize" clicked | Signup modal | Immediately | ✅ Yes | ✅ Yes (feature) |
| 4 | Rate limit hit (10/min) | Inline message | After limit exceeded | ❌ No | ⚠️ Soft |
| 5 | Rate limit hit (500/day) | Signup modal | After limit exceeded | ✅ Yes | ✅ Yes (usage) |
| 6 | Page refresh (3rd time) | Subtle banner | On load | ✅ Yes | ❌ No |
| 7 | 10 minutes of usage | Soft hint (different) | After idle 30s | ✅ Yes | ❌ No |
| 8 | Export/Download | Signup modal | On click | ✅ Yes | ✅ Yes (feature) |

---

## Trigger Details

### Trigger 1: 5th Question (Soft Hint)

**Event**: User asks their 5th question

**Condition**: Questions asked count = 5

**UX Action**:
- Question answered FIRST (priority)
- After answer displays: Inline hint appears below assistant message
- Message: "💡 Sign up to save this conversation and unlock faster responses"
- Button: "Sign Up" (primary) + "×" (dismiss)

**Behavior**:
- Dismissible: ✅ Yes
- Blocking: ❌ No (can ask 6th question immediately)
- Re-appears: ❌ No (only once per session)
- Tracks: User dismissed = `signup_hint_dismissed: true`

**Design Rationale**:
- User has asked 5 questions = significant engagement
- Value delivered first (all 5 answers given)
- Soft prompt = respect, not pressure

---

### Trigger 2: "Save Chat" Feature Click

**Event**: User clicks "Save Conversation" button

**Condition**: User is anonymous + feature requires auth

**UX Action**:
- Modal overlay appears
- Heading: "Save Your Conversation"
- Body: "Sign up to save this chat and access it from any device."
- Buttons: "Sign Up with Email" | "Sign Up with Google" | "Cancel"

**Behavior**:
- Dismissible: ✅ Yes (Cancel button)
- Blocking: ✅ Yes (feature unavailable without signup)
- Fallback: If canceled, show toast: "Your chat will be lost on page refresh"
- Re-appears: ✅ Yes (every time "Save Chat" clicked)

**Design Rationale**:
- User explicitly requested feature = clear intent
- Feature-driven signup = high conversion
- Transparent about limitation

---

### Trigger 3: "Personalize Responses" Click

**Event**: User clicks "Personalize" or "Translate" or "Customize"

**Condition**: User is anonymous + feature requires profile

**UX Action**:
- Modal: "Unlock Personalization"
- Body: "Create a profile to customize responses, set preferences, and more."
- Buttons: "Create Profile" | "Cancel"

**Behavior**:
- Dismissible: ✅ Yes
- Blocking: ✅ Yes (feature requires user profile)
- Fallback: Feature grayed out after cancel

**Design Rationale**:
- Personalization inherently requires identity
- User understands the trade-off
- Feature-gated = clear value exchange

---

### Trigger 4: Rate Limit (10/min)

**Event**: User sends 11th question within 1 minute

**Condition**: Message count in last 60s > 10

**UX Action**:
- Inline message (NOT modal)
- Message: "⏱️ You've reached the anonymous limit (10 questions/minute). Sign up for unlimited questions or wait 60 seconds."
- Buttons: "Sign Up" (primary) + countdown timer

**Behavior**:
- Dismissible: ❌ No (limit is enforced)
- Blocking: ⚠️ Soft (60-second cooldown)
- Re-appears: ✅ Yes (every time limit hit)

**Design Rationale**:
- Anti-abuse protection
- Clear explanation of limit
- Signup = immediate unlock

---

### Trigger 5: Rate Limit (500/day)

**Event**: User exceeds 500 questions in 24 hours

**Condition**: Daily question count > 500 (per browser session)

**UX Action**:
- Modal: "Daily Limit Reached"
- Body: "You've asked 500 questions today! Sign up for unlimited questions."
- Buttons: "Sign Up" | "Come Back Tomorrow"

**Behavior**:
- Dismissible: ✅ Yes
- Blocking: ✅ Yes (hard limit enforced)
- Fallback: Widget disabled until 24 hours pass

**Design Rationale**:
- Extreme usage = serious user
- Hard limit prevents abuse
- Sign up = permanent unlock

---

### Trigger 6: Page Refresh (3rd Time)

**Event**: User refreshes page 3 times (session lost each time)

**Condition**: Session ID changes 3 times in 1 hour

**UX Action**:
- Banner at top: "Your conversations aren't saved. Sign up to keep them forever."
- Button: "Sign Up" + "×" (dismiss)

**Behavior**:
- Dismissible: ✅ Yes
- Blocking: ❌ No
- Re-appears: ❌ No (only once per browser)

**Design Rationale**:
- User experiencing pain point (lost conversations)
- Signup solves real problem
- Non-intrusive banner

---

### Trigger 7: 10 Minutes of Active Usage

**Event**: User has been actively using widget for 10 minutes

**Condition**: Time since first message > 10 minutes + last message < 30s ago

**UX Action**:
- Soft hint (different message): "You've been using this for 10 minutes! Sign up to unlock premium features."
- Button: "Learn More" + "×"

**Behavior**:
- Dismissible: ✅ Yes
- Blocking: ❌ No
- Re-appears: ❌ No

**Design Rationale**:
- Prolonged usage = engaged user
- Different message = fresh prompt
- Low pressure

---

### Trigger 8: Export/Download Chat

**Event**: User clicks "Download Chat" or "Export"

**Condition**: Feature requires auth

**UX Action**:
- Modal: "Export Your Chat"
- Body: "Sign up to download this conversation as PDF/Markdown."
- Buttons: "Sign Up" | "Cancel"

**Behavior**:
- Dismissible: ✅ Yes
- Blocking: ✅ Yes (feature requires server-side export)

**Design Rationale**:
- Feature-driven signup
- Clear value exchange

---

## Anti-Triggers (What NOT to Do)

❌ **Trigger on 1st question**: Too early, no value delivered
❌ **Trigger on page load**: Interruptive, no trust built
❌ **Trigger every 2 minutes**: Annoying, degrades UX
❌ **Trigger after scroll**: Unrelated to value
❌ **Fake countdown**: Dark pattern, dishonest

---

## Trigger Priority

If multiple triggers fire simultaneously:

1. **Feature-driven** (Save Chat, Personalize) → Highest priority
2. **Rate limit** (hard block) → High priority
3. **Soft hints** (5th question, 10 min) → Low priority (defer)

**Rule**: Only ONE trigger active at a time. Feature-driven trumps time-based.

---

## Trigger State Management

**Storage** (Design, not implementation):
- `question_count`: Number of questions asked
- `signup_hint_dismissed`: Boolean
- `rate_limit_timestamp`: Last rate limit hit
- `session_start_time`: Widget first loaded
- `feature_triggers_shown`: Array of triggered features

**Persistence**: In-memory only for anonymous users (no localStorage initially).

---

## Accessibility Requirements

**All triggers must**:
- Be screen-reader friendly
- Support keyboard navigation (Tab, Enter, Esc)
- Have clear focus states
- Provide dismissal via Esc key

---

## Localization (Future)

All trigger messages must support i18n:
- English (default)
- Spanish, French, German (Phase 8+)

---

## A/B Testing Considerations (Future)

**Testable Variables**:
- Trigger threshold: 5th question vs 10th question
- Message wording: "Sign up" vs "Create Account"
- Button color: Blue vs Green
- Hint persistence: Dismissible vs always-on

**Metrics**:
- Signup conversion rate per trigger
- Dismissal rate
- Time to signup after trigger

---

## Next Steps

- T027: Document non-blocking signup pattern
- T028: Auth state diagram (trigger → modal → signup → logged in)
- T029: Data ownership rules (what happens to anonymous data after signup)

---

**Last Updated**: 2025-12-27
**Status**: ✅ Design Complete (No Implementation)
