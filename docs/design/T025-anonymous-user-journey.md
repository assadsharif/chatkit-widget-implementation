# T025 — Anonymous User Journey Map

**Phase**: 5 (Design Only)
**User Story**: US3 - Progressive Signup
**Type**: User Journey Documentation

---

## Purpose

Document the anonymous user experience BEFORE any signup requirement. Focus on value delivery first, trust building second.

---

## User State: Anonymous

**Definition**: User who has NOT authenticated via email or OAuth.

**Session ID**: UUID v4 generated on first widget load (browser-local, non-persistent initially)

**Duration**: Unlimited (no time-based expiry)

---

## Journey Stages

### Stage 1: Widget Opens

**User Action**: Opens page with `<chatkit-widget>`

**System Response**:
- Widget renders immediately
- No login modal
- No signup prompt
- No blocking overlay
- Session ID generated (stored in memory, not localStorage yet)

**User Perception**: "I can start immediately, no friction."

---

### Stage 2: First Question

**User Action**: Types "What is embodied AI?" and clicks Send

**System Response**:
- Message sent to backend with `tier: "anonymous"`
- Backend responds with RAG answer
- No signup interruption
- No delayed response
- Full answer quality (same as authenticated users for now)

**User Perception**: "This actually works. No bait-and-switch."

---

### Stage 3: Follow-Up Questions (2-5)

**User Action**: Asks 2-4 more questions

**System Response**:
- All questions answered fully
- No degradation of service
- No signup hints yet
- Rate limit: 10 questions/minute (enforced, not shown)

**User Perception**: "I'm getting real value. Trust is building."

---

### Stage 4: 5th Question (Soft Prompt Trigger)

**User Action**: Asks 5th question

**System Response**:
- Question answered FIRST
- After answer displays: Subtle hint below message
- Example: "💡 Sign up to save this conversation and get faster responses"
- Hint is dismissible (×)
- Hint does NOT block next question

**User Perception**: "They delivered first, now offering more. Fair."

---

### Stage 5: Continued Anonymous Use

**User Action**: Dismisses hint, asks more questions

**System Response**:
- Questions continue to work
- Rate limit remains: 10/min
- No pestering
- No degraded service

**User Perception**: "Respect. They're not forcing me."

---

### Stage 6: Value-Driven Signup Trigger

**User Action**: Clicks "Save Chat" or "Personalize Responses"

**System Response**:
- Modal appears: "Sign up to unlock this feature"
- Explains benefit clearly
- Offers cancel option
- If canceled: Feature gracefully unavailable, chat continues

**User Perception**: "I want that feature. Signup makes sense now."

---

## Capabilities (Anonymous)

**Enabled**:
- ✅ Ask unlimited questions (within rate limit)
- ✅ Receive full RAG answers
- ✅ See source citations
- ✅ Browse mode + Chat mode
- ✅ Selected text questions
- ✅ Session persists within browser tab (non-persistent)

**Disabled**:
- ❌ Save conversation history (no persistence)
- ❌ Personalized responses (no user profile)
- ❌ Advanced features (translation, summarization - future)
- ❌ Cross-device sync
- ❌ Chat export

---

## Limitations (Anonymous)

**Rate Limits**:
- 10 questions per minute
- 500 questions per day (per browser session)
- After exceeded: "You've reached the anonymous limit. Sign up for unlimited questions."

**Memory**:
- Session ID stored in browser memory only
- Lost on page refresh (conversation lost)
- No localStorage initially
- No server-side session storage

**Features**:
- Source citation: ✅ Enabled
- Chapter controls: ❌ Disabled (requires login)
- Personalization: ❌ Disabled (requires login)
- Export/Save: ❌ Disabled (requires login)

---

## Trust Building Signals

**Why Anonymous Works First**:
1. **No Risk**: User tries without commitment
2. **Instant Value**: First question answered = trust earned
3. **No Bait-and-Switch**: Quality doesn't degrade
4. **Respect**: No forced signup
5. **Clear Value Prop**: "Sign up unlocks X" is earned, not demanded

---

## Anti-Patterns Avoided

❌ **Login Wall**: "Sign in to continue" on first visit
❌ **Teaser Responses**: "Sign up to see full answer"
❌ **Aggressive Modals**: Popup after 2 questions
❌ **Degraded Service**: Slow/bad answers for anonymous users
❌ **Dark Patterns**: Fake countdown timers, scarcity tactics

---

## User Quotes (Hypothetical)

**Good Experience**:
> "I asked 3 questions before realizing I wasn't logged in. Impressed."

**Bad Experience** (if done wrong):
> "Asked one question, got hit with login modal. Closed tab."

---

## Success Metrics (Future)

**Measure**:
- % of anonymous users asking ≥3 questions (value delivered)
- % of anonymous users who sign up (conversion)
- Time to first signup (longer = more trust built)
- Signup reason: Feature-driven vs forced (feature-driven = better)

---

## Design Philosophy

**"Value First → Trust → Signup"**

Not:
~~"Signup → Maybe Value"~~

---

## Next Steps

- T026: Define exact triggers for signup prompts
- T027: Document non-blocking signup pattern
- T028: Auth state diagram (Anonymous → Logged In)

---

**Last Updated**: 2025-12-27
**Status**: ✅ Design Complete (No Implementation)
