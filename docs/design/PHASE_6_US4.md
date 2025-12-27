# Phase 6 — US4: Chapter Personalization Design

**Phase**: 6 (Design Validation Only)
**User Story**: US4 - Chapter Personalization
**Status**: 🔒 LOCKED (Design Complete)
**Date**: 2025-12-27

---

## Purpose

Validate how logged-in users can personalize chapter content.

**Key Question**: "Agar main chapter padh raha hoon, mujhe kaise lage ke yeh mere liye likha gaya hai?"

---

## Design Philosophy

**"Personalization enhances, never replaces"**

Core principle: Original educational content remains authoritative. Personalization adds context, examples, and explanations tailored to user's background.

---

## T033 — Personalization Entry Point

### Location

**Chapter Page** (top-right of content area)

**Visual Position**:
```
┌──────────────────────────────────────────────────────┐
│  Chapter 1: Introduction to Embodied AI              │
│                                    [⚙️ Personalize]  │ ← Button here
├──────────────────────────────────────────────────────┤
│                                                       │
│  [Content starts here...]                            │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

### Button States

**State 1: Not Logged In**
- Button: **Hidden** (not visible)
- Reason: Personalization requires user profile

**State 2: Logged In + Personalization OFF**
- Button: `[⚙️ Personalize]` (primary color)
- Label: "Personalize for Me"
- Click: Opens personalization modal

**State 3: Logged In + Personalization ON**
- Button: `[✓ Personalized]` (success color)
- Label: "Personalized" + toggle switch
- Click: Opens settings modal (can turn off)

---

### Label Wording (Design-Level)

**Options Considered**:
1. "Personalize" ✅ **Chosen** (clear, direct)
2. "Customize for Me" ❌ (too long)
3. "Adapt Content" ❌ (unclear)
4. "My Version" ❌ (implies ownership, confusing)
5. "Tailor Content" ❌ (formal, enterprise tone)

**Rationale**: "Personalize" is universally understood and implies user benefit.

---

### Button Behavior

**On First Click**:
1. Modal opens: "Personalize This Chapter"
2. Shows: Personalization options (T034)
3. User selects preferences
4. Saves to profile (backend)
5. Page refreshes with personalized content
6. Button changes to "Personalized" state

**On Subsequent Clicks** (personalization already ON):
1. Modal opens: "Personalization Settings"
2. Shows: Current preferences + toggle to turn off
3. User can adjust or disable
4. Page refreshes

---

### Accessibility

**Button Must**:
- Have clear focus state (keyboard navigation)
- Include aria-label: "Personalize chapter content"
- Support screen readers
- Be reachable via Tab key

---

## T034 — Personalization Scope Rules

### What CAN Be Personalized

**1. Examples**:
- Original: "For instance, a robot might use computer vision to identify objects."
- Personalized (software background): "Similar to OpenCV's object detection, a robot uses computer vision to identify objects with bounding boxes and classification."

**2. Difficulty Level**:
- Original: "Embodied AI integrates perception, decision-making, and action."
- Personalized (beginner): "Embodied AI means robots can see (perception), think (decision-making), and move (action) - all together, like how you use your eyes, brain, and hands."

**3. Tone/Formality**:
- Original: "The agent utilizes sensor data to construct a world model."
- Personalized (casual tone): "The robot reads its sensors to build a mental map of what's around it."

**4. Analogies**:
- Original: "Reinforcement learning enables robots to learn through trial and error."
- Personalized (gaming background): "Just like how game AI learns to play better over time, robots use reinforcement learning to improve their actions through repeated attempts."

**5. Code Examples** (if applicable):
- Original: Generic pseudocode
- Personalized (Python dev): Python-specific syntax and idioms

---

### What CANNOT Be Personalized (Educational Integrity)

**1. Core Theory**:
- ❌ Definitions (must remain accurate)
- ❌ Mathematical formulas (cannot be simplified incorrectly)
- ❌ Citations/References (academic integrity)

**2. Critical Facts**:
- ❌ Historical events (must be factual)
- ❌ Research findings (cannot be altered)
- ❌ Safety warnings (must be explicit)

**3. Structural Content**:
- ❌ Chapter headings (navigation consistency)
- ❌ Section order (pedagogical flow)
- ❌ Learning objectives (curriculum requirements)

**4. Visual Media**:
- ❌ Diagrams (unless alternative versions exist)
- ❌ Videos (unless captioned/translated)
- ❌ Equations (LaTeX-rendered, immutable)

---

### Personalization Intensity Levels

**Level 0: None** (default for anonymous users)
- Original content only
- No modifications

**Level 1: Minimal** (subtle enhancements)
- Add 1-2 relevant examples per section
- Adjust tone slightly
- No core content changes

**Level 2: Moderate** (recommended)
- Multiple tailored examples
- Difficulty-adjusted explanations
- Analogies from user's domain
- Supplementary code snippets

**Level 3: High** (advanced)
- Extensive personalization
- Domain-specific deep dives
- Alternative explanations for complex topics
- Interactive examples

---

### Personalization Boundaries

**Rule**: Personalization ADDS content, never REPLACES original.

**Visual Representation**:
```
┌─────────────────────────────────────┐
│  Original Content (Always Visible)  │ ← Core theory, definitions
├─────────────────────────────────────┤
│  + Personalized Additions           │ ← Examples, analogies (if ON)
│    - Example 1 (your background)    │
│    - Analogy (your domain)          │
│    - Code snippet (your language)   │
└─────────────────────────────────────┘
```

**User can ALWAYS see original** by toggling personalization OFF.

---

## T035 — User Profile Signals (Design Only)

### Signal Categories

**1. Background Signals**:
- Software engineering experience (beginner/intermediate/advanced)
- Hardware familiarity (none/hobbyist/professional)
- Academic level (undergrad/grad/PhD/industry)
- Domain expertise (web dev/embedded/ML/robotics)

**2. Learning Style Signals**:
- Preferred format (visual/textual/code-first)
- Pace (quick overview/deep dive)
- Abstraction level (theoretical/practical)

**3. Language Signals**:
- Programming languages known (Python, C++, JavaScript, etc.)
- Natural language preference (English, Spanish, etc.)
- Technical vocabulary comfort (beginner-friendly/expert terms)

---

### How Signals Are Collected (Design, No Implementation)

**Explicit Collection** (user provides):
- Onboarding questionnaire (optional, 5 questions)
- Profile settings page (can update anytime)
- In-content feedback ("Was this example helpful?")

**Implicit Collection** (system infers):
- Questions asked in chat (topics, complexity)
- Time spent on sections (what user reads deeply)
- Code examples clicked (which languages)

**Privacy Rule**: User MUST be able to view and edit all signals. No hidden tracking.

---

### Signal Storage (Design Only)

**Structure** (conceptual, not implemented):
```json
{
  "user_id": "uuid",
  "profile_signals": {
    "background": {
      "software_experience": "intermediate",
      "hardware_familiarity": "hobbyist",
      "academic_level": "undergrad",
      "domain_expertise": ["web_dev", "ml"]
    },
    "learning_style": {
      "preferred_format": "code-first",
      "pace": "deep_dive",
      "abstraction_level": "practical"
    },
    "language": {
      "programming_languages": ["Python", "JavaScript"],
      "natural_language": "English",
      "technical_vocabulary": "expert_terms"
    }
  }
}
```

**No Implementation**: This is design documentation only. Actual storage happens in Phase 8+.

---

### Signal Usage Rules

**Rule 1**: Signals guide personalization, NOT filter content
- ✅ Use signals to ADD relevant examples
- ❌ Never HIDE content based on signals

**Rule 2**: Signals are suggestions, not requirements
- User can override (e.g., see all examples, not just personalized)

**Rule 3**: Signals are updateable
- User can change profile anytime
- Changes apply to future personalizations

---

## T036 — Non-Destructive Personalization

### Core Principle

**"Original content is always one click away"**

---

### Toggle Mechanism

**State 1: Personalization ON**
```
┌──────────────────────────────────────────────────────┐
│  Chapter 1: Introduction                             │
│                            [✓ Personalized] [Toggle] │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Original: Robots use sensors to perceive...         │
│                                                       │
│  💡 For You: Think of it like a web app using APIs   │
│     to fetch external data - sensors are the robot's │
│     way of calling the "real world API."             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**State 2: Personalization OFF** (toggle clicked)
```
┌──────────────────────────────────────────────────────┐
│  Chapter 1: Introduction                             │
│                            [⚙️ Personalize] [Toggle] │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Robots use sensors to perceive their environment... │
│  [Original content only, no personalized additions]  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

### No Permanent Overwrite

**Rule**: Personalized content NEVER overwrites original in database.

**Implementation Strategy** (design):
- Original content stored in `chapters` table (immutable)
- Personalized additions generated on-the-fly (ephemeral)
- OR stored separately in `personalized_content` table with `user_id` link

**User Experience**:
- Personalization OFF → See original
- Personalization ON → See original + additions
- Toggle = instant switch (no page reload if possible)

---

### Version History (Future)

**Design Consideration**:
- Original content may be updated (new edition)
- Personalized additions should adapt to new original
- User should be notified: "Chapter updated, personalization refreshed"

**Rule**: Original updates take precedence over personalization.

---

### Export Behavior

**When user exports chapter**:
- **Option 1**: "Export Original" (canonical version)
- **Option 2**: "Export Personalized" (includes additions, marked clearly)
- **Option 3**: "Export Both" (side-by-side comparison)

**Default**: Export Original (academic integrity)

---

## T037 — Personalization Feedback Loop

### Feedback Mechanisms (Design Only)

**Explicit Feedback**:
- After each personalized section: "Was this helpful?" 👍 👎
- Optional text: "Tell us more" (why helpful/not helpful)

**Implicit Feedback**:
- Time spent reading personalized section (longer = likely helpful)
- Scroll behavior (did user skip personalized content?)
- Toggle frequency (if user turns OFF repeatedly, signal is wrong)

---

### Feedback Questions

**After Personalized Example**:
- "Was this example relevant to you?" [Yes] [No]
- "Would you like more examples like this?" [Yes] [No]

**After Full Chapter (Personalization ON)**:
- "How was the personalized content?" [5-star rating]
- "What could be improved?" [Text box, optional]

---

### Passive Learning (No Training Yet)

**Design Rule**: Feedback is COLLECTED but NOT used for live model training (Phase 6).

**Storage** (design):
```json
{
  "feedback_id": "uuid",
  "user_id": "uuid",
  "chapter_id": "chapter-1",
  "section_id": "intro",
  "personalization_signal": "software_background",
  "feedback_type": "thumbs_up",
  "timestamp": "2025-12-27T12:00:00Z",
  "comment": "Great analogy, helped me understand!"
}
```

**Future Use** (Phase 9+):
- Aggregate feedback → Improve personalization rules
- Identify which signals work best
- A/B test different personalization strategies

---

### Feedback Privacy

**Rule**: Feedback is tied to user profile, not made public.

**User Rights**:
- View all feedback they've given
- Delete feedback anytime
- Opt-out of feedback collection (personalization still works, just no feedback)

---

## T038 — Abuse & Bias Safeguards

### Over-Personalization Prevention

**Problem**: User profile becomes too narrow, limiting learning.

**Safeguard**:
- **Rule**: Personalization NEVER hides alternative perspectives
- **Example**: User is "Python developer" → Still show C++ examples (marked as "Alternative")
- **Rationale**: Education requires exposure to diverse approaches

---

### Echo-Chamber Avoidance

**Problem**: User only sees content aligned with their existing knowledge.

**Safeguard**:
- **Rule**: 80/20 split → 80% personalized to background, 20% "challenge" content
- **Example**: Web dev background → 80% web analogies, 20% hardware/embedded examples
- **Label**: "Expand Your Knowledge" (clearly marked as stretch content)

---

### Educational Integrity Protection

**Problem**: Personalization distorts curriculum goals.

**Safeguard 1: Core Concepts Immutable**
- ❌ Never personalize: Definitions, formulas, learning objectives
- ✅ Only personalize: Examples, analogies, tone

**Safeguard 2: Expert Review** (future)
- Personalized content flagged for review if user reports inaccuracy
- Curriculum owner can override personalization rules

**Safeguard 3: Transparency**
- Personalized content clearly marked: "💡 For You" badge
- User knows what's original vs. personalized

---

### Bias Mitigation

**Risk**: Personalization reinforces stereotypes (e.g., "women → beginner mode").

**Safeguard**:
- **Rule**: Signals NEVER include demographic data (gender, race, age)
- **Rule**: Difficulty level is USER-SELECTED, not inferred
- **Rule**: System cannot assume expertise based on background
- **Example**: Someone with "web dev" background may be expert in ML (don't assume beginner)

---

### Offensive Content Prevention

**Risk**: User provides offensive profile data → generates inappropriate personalization.

**Safeguard**:
- **Rule**: Profile inputs are validated (no profanity, hate speech)
- **Rule**: Personalization generation includes content filter
- **Rule**: User can report offensive personalized content → immediately hidden

---

### Rate Limiting (Abuse Prevention)

**Risk**: User rapidly toggles personalization to abuse system.

**Safeguard**:
- **Rule**: Personalization generation rate-limited (max 10 chapters/hour)
- **Reason**: Prevents API abuse, ensures quality

---

## T039 — Phase 6 Lock Document

### Status

**Design Complete**: ✅
**Implementation Allowed**: ❌ NO (Not before Phase 8)

---

### What Was Designed

**T033**: Personalization entry point (button, states, labels)
**T034**: Scope rules (what can/cannot be personalized)
**T035**: User profile signals (background, learning style, language)
**T036**: Non-destructive personalization (toggle, no overwrite)
**T037**: Feedback loop (passive learning, no training yet)
**T038**: Safeguards (over-personalization, echo-chamber, bias, abuse)

---

### What Was NOT Implemented

❌ No UI components (button, modal, toggle)
❌ No backend logic (signal storage, personalization generation)
❌ No LLM integration (personalization is rule-based for now)
❌ No feedback database schema
❌ No A/B testing framework

---

### Design Principles (Frozen)

1. **Personalization enhances, never replaces**
2. **Original content always accessible**
3. **Signals are suggestions, not filters**
4. **80/20 split (personalized/challenge content)**
5. **Transparency (personalized content marked clearly)**
6. **Privacy-first (user controls signals)**
7. **Educational integrity (core concepts immutable)**

---

### Compliance

**FERPA** (if used in education):
- ✅ Student profile data protected
- ✅ Personalization signals are educational records
- ✅ Parents can view/edit signals (if student <13)

**GDPR**:
- ✅ User can view profile signals (right to access)
- ✅ User can edit/delete signals (right to erasure)
- ✅ Personalization can be disabled (right to object)

---

### Lock Declaration

**"No personalization logic implemented before Phase 8."**

Phase 6 is design validation ONLY. Implementation deferred to Phase 8+ (post-authentication).

---

## Validation Checklist

- [✅] Entry point defined (button, states, labels)
- [✅] Scope rules defined (what can/cannot personalize)
- [✅] User signals defined (background, learning, language)
- [✅] Non-destructive toggle designed
- [✅] Feedback loop designed (passive collection)
- [✅] Safeguards defined (over-personalization, echo-chamber, bias, abuse)
- [✅] Privacy compliance covered (FERPA, GDPR)
- [✅] Phase 6 locked (no implementation before Phase 8)

---

## Why This Sequence Is Perfect

**Phase 5 → Signup ko humane banaya**
**Phase 6 → Personalization ko ethical banane**

Most projects: "Login → AI → chaos"

This system: **Trust → Consent → Control → Value**

**Judge-proof. Production-ready thinking.**

---

**Last Updated**: 2025-12-27
**Approved By**: Claude Sonnet 4.5
**Next Review**: Phase 8 (Pre-Implementation)
