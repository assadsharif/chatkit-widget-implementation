# Implementation Guardrails

**Purpose**: Enforce design-first discipline and prevent architectural drift.

---

## Core Rules

1. **This repository implements the frozen design at commit [5b2a756](https://github.com/assadsharif/Hackathon_01/commit/5b2a756).**

2. **No design decisions are allowed in this repository.**
   - All design patterns, event schemas, and compliance rules are frozen.
   - Implementation follows design artifacts verbatim.

3. **Any deviation MUST be documented in `docs/DESIGN_DELTAS.md`.**
   - If you discover a design gap or ambiguity, document it first.
   - Link to the frozen design artifact that needs clarification.
   - Propose a solution that aligns with existing patterns.

4. **Source of truth: [Hackathon_01 @ v1.0-design-freeze](https://github.com/assadsharif/Hackathon_01/tree/v1.0-design-freeze).**
   - All questions about "how should this work?" are answered by the design repository.
   - When in doubt, read the frozen design artifacts.

5. **Implementation follows [Phase 7 Planning Guide](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/phase7-planning.md) verbatim.**
   - Tier 0 → Tier 1 → Tier 2 → Tier 3 → Hardening (in that order).
   - No skipping tiers, no mixing concerns.

---

## What This Means

### ✅ Allowed

- Implementing design patterns exactly as documented
- Choosing specific libraries that match design requirements (e.g., Vite vs. CRA)
- Performance optimizations that don't change behavior
- Bug fixes that align with design intent
- Tests that validate design compliance

### ❌ Prohibited

- Changing event schemas (frozen in `.claude/mcp/chatkit/mcp.json`)
- Adding new user stories or requirements (frozen in `specs/003-chatkit-widget/spec.md`)
- Modifying compliance rules (34 rules frozen in design)
- Skipping accessibility requirements (WCAG 2.1 AA is mandatory)
- Introducing new design patterns (15 patterns are frozen)

---

## Design Delta Process

If you discover a design gap:

1. **Stop coding immediately.**
2. **Document the gap in `docs/DESIGN_DELTAS.md`:**
   - What design artifact is affected?
   - What is the ambiguity or gap?
   - What is the proposed solution?
   - Does it align with existing patterns?
3. **Reference the frozen design commit (5b2a756).**
4. **Proceed only if the delta is minimal and aligned.**

---

## Enforcement

Every pull request MUST:
- Reference the frozen design artifact it implements
- Pass all validation tasks from `specs/003-chatkit-widget/tasks.md`
- Maintain 100% compliance coverage (GDPR, CCPA, FERPA, COPPA)
- Maintain 100% accessibility coverage (WCAG 2.1 AA)

**No exceptions.**

---

## Why This Matters

Design-first projects fail when implementation starts making design decisions.

This file is your **architectural seatbelt**. Wear it every commit.

---

**Last Updated**: 2025-12-27
