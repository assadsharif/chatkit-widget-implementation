# Design Deltas

**Purpose**: Document any deviations from the frozen design at commit [5b2a756](https://github.com/assadsharif/Hackathon_01/commit/5b2a756).

---

## What Goes Here

If you discover a design gap, ambiguity, or need to deviate from the frozen design:

1. Document it here **before** implementing
2. Reference the frozen design artifact
3. Propose a solution that aligns with existing patterns
4. Get approval (or self-approve with clear rationale)

---

## Format

```markdown
## Delta #001: [Brief Title]

**Date**: YYYY-MM-DD
**Affected Artifact**: [Link to frozen design file]
**Discovered By**: [Your Name]

**Gap/Ambiguity**:
[Describe what's missing or unclear in the frozen design]

**Proposed Solution**:
[How you plan to resolve it while staying aligned with design patterns]

**Alignment Check**:
- Does it follow existing patterns? [Yes/No + explanation]
- Does it maintain compliance? [Yes/No + explanation]
- Does it maintain accessibility? [Yes/No + explanation]

**Status**: [Proposed/Approved/Implemented]
```

---

## Deltas

### Delta #001: Runtime Framework Choice Clarification

**Date**: 2025-12-27
**Affected Artifact**: [Phase 7 Planning Guide](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/phase7-planning.md)
**Discovered By**: Implementation Team

**Gap/Ambiguity**:
The original design did not mandate any specific frontend framework (React, Vue, etc.). The Phase 7 Planning Guide mentions "React + TypeScript + Tailwind CSS" as recommendations, but does not require them as architectural constraints.

**Proposed Solution**:
Implement the ChatKit Widget as a **framework-agnostic Web Component** using:
- Custom Elements API (native browser standard)
- Shadow DOM (encapsulation)
- TypeScript (compiled to vanilla JS)
- Zero framework dependencies

This enables:
- ✅ Docusaurus embedding (`<chatkit-widget></chatkit-widget>`)
- ✅ Plain HTML usage (any static site)
- ✅ Framework-optional consumption (React/Vue can use it, but don't require it)
- ✅ Smaller bundle size (no framework overhead)
- ✅ Long-term portability (browser standards evolve slower than frameworks)

**Alignment Check**:
- **Does it follow existing patterns?** Yes - Event-driven architecture (Pattern 1) is preserved via CustomEvents
- **Does it maintain compliance?** Yes - All GDPR/CCPA/FERPA/COPPA rules apply regardless of framework choice
- **Does it maintain accessibility?** Yes - WCAG 2.1 AA requirements are framework-independent

**Status**: Approved (implementation in progress)

**Reference**: commit [5b2a756](https://github.com/assadsharif/Hackathon_01/commit/5b2a756)

---

**Last Updated**: 2025-12-27
