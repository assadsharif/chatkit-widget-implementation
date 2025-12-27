# T030 — Consent Timing Rules

**Phase**: 5 (Design Only)
**Status**: ✅ Design Complete (No Implementation)

---

## When Consent is Asked

| Event | Consent Type | Timing | Required | Can Decline |
|-------|--------------|--------|----------|-------------|
| **Signup** | Data storage | Before account creation | ✅ Yes | ✅ Yes (no signup) |
| **Save conversation** | Conversation migration | Before migration | ✅ Yes | ✅ Yes (discard) |
| **Analytics tracking** | Usage telemetry | First session (banner) | ❌ No | ✅ Yes (opt-out) |
| **OAuth** | Third-party access | Before OAuth redirect | ✅ Yes | ✅ Yes (use email) |
| **Personalization** | Profile data usage | After signup | ❌ No | ✅ Yes (disable feature) |

---

## What Happens If Declined

**Signup Declined**: Chat continues as anonymous
**Migration Declined**: Conversation discarded, fresh start
**Analytics Declined**: No telemetry collected
**OAuth Declined**: Email signup offered instead
**Personalization Declined**: Generic responses, feature disabled

---

## What Features Stay Unlocked (No Consent Required)

- ✅ Ask questions (anonymous)
- ✅ Receive answers (anonymous)
- ✅ See source citations
- ✅ Use browse/chat modes
- ✅ Rate-limited usage (10/min, 500/day)

---

**Last Updated**: 2025-12-27
