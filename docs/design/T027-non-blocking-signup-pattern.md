# T027 — Non-Blocking Signup Pattern

**Phase**: 5 (Design Only)
**User Story**: US3 - Progressive Signup
**Type**: Pattern Documentation

---

## Pattern Name

**"Value-First Progressive Auth"**

---

## Problem Statement

Traditional signup patterns:
- Force signup BEFORE value delivery
- Interrupt user flow
- Create high friction
- Result in high bounce rates

**Bad Pattern Example**:
```
User opens app
  → Login modal blocks screen
  → User hasn't seen value yet
  → User bounces (50-80% drop-off)
```

---

## Solution Pattern

**Value-First Progressive Auth**:
1. Deliver value FIRST (no signup required)
2. Build trust through working features
3. Offer signup as VALUE UNLOCK, not gate
4. Make signup optional until feature explicitly requires it

---

## Pattern Rules

### Rule 1: No Forced Modal on Open

❌ **NEVER**:
```
Widget loads → Signup modal appears → User must dismiss or signup
```

✅ **ALWAYS**:
```
Widget loads → Fully functional → User can ask questions immediately
```

**Rationale**: First impression = "This works" vs "Another paywall"

---

### Rule 2: No Interrupting Answers

❌ **NEVER**:
```
User asks question → Answer starts loading → Modal: "Sign up to see full answer"
```

✅ **ALWAYS**:
```
User asks question → Full answer delivered → Optional hint: "Sign up for more features"
```

**Rationale**: Bait-and-switch destroys trust permanently

---

### Rule 3: Signup Happens AFTER Value Delivered

❌ **NEVER**:
```
User opens widget → "Sign up to unlock AI chat"
```

✅ **ALWAYS**:
```
User asks 5 questions → All answered → "Sign up to save your conversation"
```

**Rationale**: User has experienced value, signup is now a clear upgrade

---

### Rule 4: Feature-Gated, Not Experience-Gated

❌ **NEVER**:
- Degrade answer quality for anonymous users
- Slow down responses intentionally
- Show ads to anonymous users
- Limit basic chat functionality

✅ **ALWAYS**:
- Core chat experience is IDENTICAL for anonymous and logged-in users
- Signup unlocks ADDITIVE features (save, export, personalize)
- Rate limits are reasonable (10/min, 500/day)

**Rationale**: Basic experience must be excellent, or user won't care about upgrades

---

### Rule 5: Respect Dismissals

❌ **NEVER**:
```
User dismisses signup hint → Show same hint 2 minutes later
```

✅ **ALWAYS**:
```
User dismisses signup hint → Don't show again this session
```

**Rationale**: Respecting user choice builds trust

---

### Rule 6: Clear Value Proposition

❌ **NEVER**:
- "Sign up" (no reason given)
- "Create Account" (why?)
- "Register Now" (for what?)

✅ **ALWAYS**:
- "Sign up to save this conversation"
- "Create account to unlock personalization"
- "Register to export your chat history"

**Rationale**: User needs to understand WHAT they're getting

---

### Rule 7: Always Provide Escape Path

❌ **NEVER**:
- Modal with no X button
- Forced signup to continue

✅ **ALWAYS**:
- Every modal has "Cancel" or "×"
- Canceling gracefully returns to previous state
- Feature remains unavailable but chat continues

**Rationale**: User autonomy = trust

---

## Pattern Implementation (Conceptual)

### Step 1: Anonymous First Experience

```
User State: Anonymous
Widget Behavior:
  - Load instantly
  - No prompts
  - Full chat functionality
  - Session ID generated (memory only)
  - Rate limit: 10/min (enforced silently)
```

---

### Step 2: Value Delivery

```
User Action: Asks questions
Widget Behavior:
  - Answer every question fully
  - No degradation
  - No interruptions
  - Count questions internally
```

---

### Step 3: Soft Trigger (Optional)

```
Trigger: 5th question OR 10 minutes usage
Widget Behavior:
  - Show dismissible hint AFTER answer
  - Message: "Sign up to save your conversation"
  - Button: "Sign Up" + "×"
  - If dismissed: Don't show again this session
```

---

### Step 4: Feature Trigger (Required)

```
User Action: Clicks "Save Chat"
Widget Behavior:
  - Modal: "Save Your Conversation"
  - Explain benefit
  - Offer signup options (Email, Google, GitHub)
  - Offer cancel
  - If canceled: Chat continues, feature unavailable
```

---

### Step 5: Signup Flow (Non-Blocking)

```
User Action: Clicks "Sign Up with Email"
Widget Behavior:
  - Open signup modal
  - Email input + verification
  - Chat remains visible in background (if possible)
  - After signup: Session data migrated
  - Feature immediately available
```

---

### Step 6: Post-Signup

```
User State: Logged In
Widget Behavior:
  - All features unlocked
  - Conversation saved
  - No more rate limits (or higher limits)
  - Personalization available
```

---

## Pattern Benefits

**For Users**:
- ✅ Zero friction to start
- ✅ Immediate value
- ✅ Clear understanding of upgrade benefits
- ✅ Autonomy respected

**For Product**:
- ✅ Higher engagement (no signup wall bounce)
- ✅ Better conversion (feature-driven signup)
- ✅ Trust-based relationship
- ✅ Higher lifetime value

---

## Pattern Anti-Patterns (Avoid)

### Anti-Pattern 1: "Freemium Trap"

❌ **Bad**:
```
Free tier: 3 questions per day
Premium tier: Unlimited questions
```

✅ **Good**:
```
Anonymous: 500 questions per day (generous)
Signed up: Unlimited + save/export features
```

**Why**: Stingy limits feel like a trap, generous limits feel like respect.

---

### Anti-Pattern 2: "Trial Timer"

❌ **Bad**:
```
"7-day free trial, then $9.99/month"
```

✅ **Good**:
```
"Free forever with basic features, upgrade for premium features"
```

**Why**: Trial timers create urgency anxiety, not trust.

---

### Anti-Pattern 3: "Bait-and-Switch Answers"

❌ **Bad**:
```
Anonymous: "Embodied AI is... [Sign up to see full answer]"
```

✅ **Good**:
```
Anonymous: Full answer delivered
After 5 questions: "Sign up to save this conversation"
```

**Why**: Partial answers are dishonest and destroy trust.

---

## Pattern Variations

### Variation 1: Immediate Signup Offer (Non-Blocking)

**Use Case**: User clearly wants advanced features

**Pattern**:
```
Widget loads → Banner at top: "Sign up for advanced features"
Banner is dismissible
Chat works fully below banner
```

**When to Use**: Enterprise/B2B contexts where signup is expected

---

### Variation 2: Delayed Persistent Hint

**Use Case**: High-value features worth promoting

**Pattern**:
```
After 10 minutes of usage → Small persistent badge: "💾 Save your progress"
Badge doesn't block, just reminds
Clicking badge opens signup modal
```

**When to Use**: Education platforms, research tools

---

### Variation 3: Zero Prompts (Pure Value-First)

**Use Case**: Extreme trust-building

**Pattern**:
```
No signup hints at all
Signup only available via explicit "Sign Up" button in corner
User must discover signup organically
```

**When to Use**: Open-source communities, academic contexts

---

## Measurement Criteria

**Success Metrics**:
- % anonymous users asking ≥5 questions (value delivered)
- % anonymous users who sign up (conversion)
- Average questions before signup (higher = more trust)
- Signup completion rate (feature-driven > prompt-driven)

**Failure Metrics**:
- % users bouncing before first question (signup wall issue)
- % users dismissing prompts repeatedly (annoyance)
- % users signing up before asking questions (premature)

---

## Accessibility Requirements

**Pattern must support**:
- ✅ Screen readers (ARIA labels on hints/modals)
- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ High contrast modes
- ✅ Reduced motion (no animated modals)

---

## Privacy & Compliance

**Pattern must ensure**:
- ✅ Anonymous data is truly anonymous (no tracking before consent)
- ✅ Signup is optional (GDPR requirement)
- ✅ Clear data handling disclosure (what's saved, what's not)
- ✅ User can delete account + data (right to erasure)

---

## Pattern Name (Official)

**"Value-First Progressive Auth"**

**Aliases**:
- "Trust-First Signup"
- "Progressive Disclosure Auth"
- "Feature-Gated Authentication"

---

## Pattern Documentation Status

**Status**: ✅ Design Complete (No Implementation)

**Next Steps**:
- T028: Auth state diagram (Anonymous → Signed Up)
- T029: Data ownership rules (what migrates after signup)
- T030: Consent timing rules (when to ask, what to ask)

---

**Last Updated**: 2025-12-27
**Status**: ✅ Design Complete (No Implementation)
