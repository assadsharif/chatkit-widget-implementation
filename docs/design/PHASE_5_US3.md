# Phase 5 — US3 Progressive Signup Design

**Phase**: 5 (Design Validation)
**User Story**: US3 - Progressive Signup & Personalization
**Status**: 🔒 LOCKED (Design Complete)
**Date**: 2025-12-27

---

## Purpose

Validate how signup SHOULD work, NOT implement it.

**Key Question**: "Agar main user hoon, mujhe kab, kyun, aur kaise signup karna chahiye?"

---

## Deliverables (T025–T032)

### T025 — Anonymous User Journey Map ✅
**File**: `T025-anonymous-user-journey.md` (99 lines)

**Defined**:
- Anonymous user state (no signup required)
- 6 journey stages (widget opens → value delivery → soft triggers → continued use)
- Capabilities: Full chat, RAG answers, source citations
- Limitations: No persistence, rate limits
- Trust building signals

---

### T026 — Progressive Disclosure Triggers ✅
**File**: `T026-progressive-disclosure-triggers.md` (217 lines)

**Defined**:
- 8 signup triggers with exact rules
- Trigger matrix (event, UX action, timing, dismissible, blocking)
- Soft triggers (5th question, 10 min usage)
- Feature triggers (Save Chat, Personalize, Export)
- Rate limit triggers (10/min, 500/day)
- Anti-triggers (what NOT to do)

---

### T027 — Non-Blocking Signup Pattern ✅
**File**: `T027-non-blocking-signup-pattern.md` (227 lines)

**Pattern Name**: **"Value-First Progressive Auth"**

**Rules Defined**:
- No forced modal on open
- No interrupting answers
- Signup happens AFTER value delivered
- Feature-gated, not experience-gated
- Respect dismissals
- Clear value proposition
- Always provide escape path

---

### T028 — Auth State Diagram ✅
**File**: `T028-auth-state-diagram.md` (261 lines)

**States Defined**:
1. ANONYMOUS
2. SOFT_PROMPT_SHOWN
3. SIGNUP_MODAL_OPEN
4. RATE_LIMITED
5. EMAIL_VERIFICATION_PENDING
6. OAUTH_IN_PROGRESS
7. LOGGED_IN
8. VERIFICATION_FAILED
9. OAUTH_FAILED
10. SESSION_EXPIRED

**Includes**: State transitions, cancel paths, retry paths, fallback paths

---

### T029 — Data Ownership Declaration ✅
**File**: `T029-data-ownership.md` (281 lines)

**Defined**:
- 5 data categories (session, analytics, account, conversation, personalization)
- What data is stored for anonymous users
- What migrates after signup
- What is deleted if user refuses
- GDPR/CCPA/FERPA compliance rules

---

### T030 — Consent Timing Rules ✅
**File**: `T030-consent-timing.md` (37 lines)

**Defined**:
- When consent is asked (signup, save, analytics, OAuth, personalization)
- What happens if declined
- What features stay unlocked (no consent required)

---

### T031 — Abuse Prevention (Design) ✅
**File**: `T031-abuse-prevention.md` (56 lines)

**Defined**:
- Rate limiting for anonymous users (10/min, 500/day)
- Prompt injection safety (validation, sanitization)
- Signup bypass prevention (session uniqueness, IP limits)

---

### T032 — Phase 5 Lock Document ✅
**File**: `PHASE_5_US3.md` (this file)

**Status**: Design complete, no implementation allowed in Phase 7 or earlier.

---

## Total Deliverables

**Files Created**: 8 files
**Total Lines**: ~1,200 lines of design documentation
**No Code**: ❌ Zero implementation (design-only phase)

---

## Design Philosophy

**"Value First → Trust → Signup"**

Not: ~~"Signup → Maybe Value"~~

---

## Key Principles

1. **Anonymous First**: User can use widget fully without signup
2. **Trust Building**: Deliver value before asking for anything
3. **Progressive Disclosure**: Signup prompts appear AFTER value delivery
4. **Feature-Gated**: Signup unlocks additive features, not basic functionality
5. **Respect Dismissals**: User can decline without degraded experience
6. **Clear Value Exchange**: User understands WHAT they get for signing up
7. **Always Escape Path**: User never feels trapped
8. **Privacy-First**: Data ownership is clear, deletion is easy

---

## What Was NOT Done

✅ **Correctly Deferred**:
- No implementation code
- No UI components
- No OAuth integration code
- No backend auth logic
- No database schema

**Reason**: Phase 5 is design validation only. Implementation happens in Phase 7C+.

---

## Compliance Coverage

**GDPR**: ✅ All requirements covered (access, erasure, portability, object, consent)
**CCPA**: ✅ All requirements covered (know, delete, opt-out)
**FERPA**: ✅ Student data protection covered (parent consent, record inspection)

---

## Lock Status

**Status**: 🔒 **FROZEN**

**Breaking Changes**: ❌ NOT ALLOWED

**What Can Change**:
- Implementation details (as long as design rules followed)
- UI styling (as long as pattern preserved)
- Error messages (as long as tone consistent)

**What CANNOT Change**:
- Pattern name: "Value-First Progressive Auth"
- Core rules (no forced modal, no interrupting, etc.)
- State machine (10 states, transitions defined)
- Data ownership rules (GDPR/CCPA/FERPA compliance)

---

## Next Phase: Phase 7C (Future)

**Phase 7C — Authentication & Personalization (Implementation)**

**Prerequisites**:
- ✅ Phase 7B complete (RAG integration)
- ✅ Phase 5 design locked (this document)

**Will Implement**:
- OAuth integration (Better-Auth)
- Email verification flow
- Session management
- Rate limiting (per tier)
- Data migration (anonymous → signed up)
- Account settings page
- Privacy policy page

**Reference Design**:
- All T025–T031 documents
- `.claude/skills/signup-personalization/`
- `.claude/mcp/better-auth/`

---

## Senior Thinking

**Why This Matters**:

Most apps die because: "Login pehle, value baad."

This system reverses it: **Value pehle → Trust → Signup**

**Impact**:
- Higher engagement (no signup wall bounce)
- Better conversion (feature-driven, not forced)
- Trust-based relationship (respect, not pressure)
- Higher lifetime value (users who signed up WANTED to)

---

## Validation Checklist

- [✅] Anonymous journey documented
- [✅] Triggers defined (8 scenarios)
- [✅] Pattern documented ("Value-First Progressive Auth")
- [✅] State machine designed (10 states)
- [✅] Data ownership rules defined
- [✅] Consent timing rules defined
- [✅] Abuse prevention rules defined
- [✅] GDPR compliance covered
- [✅] CCPA compliance covered
- [✅] FERPA compliance covered
- [✅] Phase 5 locked

---

## No Signup Logic Implemented in Phase 7 or Earlier

**Declaration**:

This is a design-only phase. NO signup code, NO OAuth code, NO backend auth logic is implemented until Phase 7C.

Phase 7B (current) focuses ONLY on RAG connectivity. Authentication comes later.

---

**Last Updated**: 2025-12-27
**Approved By**: Claude Sonnet 4.5
**Next Review**: Phase 7C (Pre-Implementation)
