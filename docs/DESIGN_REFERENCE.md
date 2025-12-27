# Design Reference Links

**Implementation derived from frozen design at commit [5b2a756](https://github.com/assadsharif/Hackathon_01/commit/5b2a756).**

---

## Design Repository

**Repository**: [Hackathon_01](https://github.com/assadsharif/Hackathon_01)
**Tag**: [v1.0-design-freeze](https://github.com/assadsharif/Hackathon_01/tree/v1.0-design-freeze)
**Freeze Date**: 2025-12-27

---

## Core Design Artifacts

### Feature Specification
- [Spec](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/spec.md) - 6 user stories, 48 requirements, 34 compliance rules
- [Tasks](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/tasks.md) - 61 validation tasks
- [Traceability](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/traceability.md) - User stories → requirements → tasks

### Design Patterns
- [ChatKit Widget Patterns](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/chatkit-widget/patterns.md) - 6 reusable patterns
- [RAG Chatbot Patterns](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/rag-chatbot/patterns.md) - 5 reusable patterns
- [Signup Personalization Patterns](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/signup-personalization/patterns.md) - 4 reusable patterns

### MCP Servers (Design-Time Intelligence)
- [ChatKit MCP](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/mcp/chatkit/README.md) - Event schemas, state machines
- [Better-Auth MCP](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/mcp/better-auth/README.md) - OAuth, session management

### Planning & Validation
- [Phase 7 Planning Guide](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/phase7-planning.md) - Implementation roadmap, framework recommendations
- [Validation Reports](https://github.com/assadsharif/Hackathon_01/tree/v1.0-design-freeze/specs/003-chatkit-widget/validation) - 15 validation reports
- [Integration Guides](https://github.com/assadsharif/Hackathon_01/tree/v1.0-design-freeze/specs/003-chatkit-widget/integration) - 10 integration guides
- [Checklists](https://github.com/assadsharif/Hackathon_01/tree/v1.0-design-freeze/specs/003-chatkit-widget/checklists) - 8 checklists

---

## Design Patterns Quick Reference

### Pattern 1: Event-Driven Widget Architecture
- **Problem**: Tight coupling between widget and backend services
- **Solution**: Event bus with standardized events
- **Reference**: [ChatKit Patterns - Pattern 1](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/chatkit-widget/patterns.md#pattern-1-event-driven-widget-architecture)

### Pattern 2: Progressive Loading Strategy
- **Problem**: Large initial bundle size
- **Solution**: Code splitting, lazy loading, skeleton UI
- **Reference**: [ChatKit Patterns - Pattern 2](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/chatkit-widget/patterns.md#pattern-2-progressive-loading-strategy)

### Pattern 3: Session Continuity Across Tiers
- **Problem**: Loss of conversation history during tier upgrades
- **Solution**: Session merge algorithm (localStorage → server)
- **Reference**: [ChatKit Patterns - Pattern 3](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/chatkit-widget/patterns.md#pattern-3-session-continuity-across-tiers)

### Pattern 4: Citation Rendering with Stable IDs
- **Problem**: Broken citations when content changes
- **Solution**: Stable-ID citation system
- **Reference**: [ChatKit Patterns - Pattern 4](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/chatkit-widget/patterns.md#pattern-4-citation-rendering-with-stable-ids)

### Pattern 5: Graceful Degradation
- **Problem**: Total failure when services unavailable
- **Solution**: Circuit breaker, offline FAQ, error boundaries
- **Reference**: [ChatKit Patterns - Pattern 5](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/chatkit-widget/patterns.md#pattern-5-graceful-degradation)

### Pattern 6: Contextual Feature Discovery
- **Problem**: Users unaware of available features
- **Solution**: Progressive disclosure, tooltips, onboarding
- **Reference**: [ChatKit Patterns - Pattern 6](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/chatkit-widget/patterns.md#pattern-6-contextual-feature-discovery)

---

## Compliance Requirements

All 34 compliance rules must be implemented:

### GDPR (5 rules)
- Explicit consent before data collection
- Data export (JSON/CSV)
- Data deletion (one-click)
- Retention policy (30-day anonymous, until-deletion authenticated)
- Privacy policy disclosure

### CCPA (2 rules)
- "Do Not Sell My Data" opt-out
- Third-party sharing disclosure

### FERPA (3 rules)
- Age gate (13+)
- Parental consent (<18)
- Encrypted educational records

### COPPA (6 rules)
- Age verification (<13)
- Parental consent flow
- Disabled features for children (social sharing, public profiles, analytics)

### Security (10 rules)
- Input sanitization (HTML escaping, CSP)
- CSRF protection (token-based, SameSite cookies)
- Rate limiting (30/min authenticated, 10/min anonymous)
- Session security (JWT 15min access, 7-day refresh, HttpOnly/Secure)
- Content Security Policy headers

### Performance (8 budgets)
- Initial bundle: ≤100 KB (gzip)
- Total bundle: ≤300 KB (gzip)
- Time to Interactive: ≤3s (3G)
- First Contentful Paint: ≤1.5s
- Cumulative Layout Shift: ≤0.1
- API response time: ≤500ms (p95)

**Reference**: [Spec - Compliance Rules](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/spec.md#compliance-rules)

---

## Accessibility Requirements

WCAG 2.1 AA compliance (50+ criteria):

- **Keyboard Navigation**: All 7 flows documented in [Keyboard Navigation Guide](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/integration/keyboard-navigation.md)
- **Screen Readers**: NVDA, JAWS, VoiceOver, TalkBack support
- **Color Contrast**: ≥4.5:1 (normal text), ≥3:1 (large text)
- **Focus Indicators**: Visible focus outline
- **High Contrast Mode**: Windows High Contrast support
- **Reduced Motion**: Respect `prefers-reduced-motion`

**Reference**: [WCAG Compliance Checklist](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/checklists/wcag-compliance.md)

---

## Testing Requirements

### Unit Tests (Jest + React Testing Library)
- Component rendering
- Event handlers
- Hooks (useChatSession, useRAG, useAuth)
- Service layer (event bus, API clients)

### E2E Tests (Playwright)
- User flows (anonymous chat, signup, OAuth)
- Cross-browser (Chrome, Firefox, Safari)
- Mobile (iOS Safari, Android Chrome)

### Accessibility Tests
- axe-core automated scans
- Manual screen reader testing (NVDA, JAWS, VoiceOver, TalkBack)
- Keyboard navigation testing

### Performance Tests
- Lighthouse CI (performance, accessibility, best practices, SEO)
- Bundle size analysis (webpack-bundle-analyzer)
- Load testing (k6 or Artillery)

**Reference**: [Phase 7 Planning - Testing Strategy](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/phase7-planning.md#testing-strategy)

---

## Implementation Checkpoints

Track implementation progress against design artifacts:

- [ ] **Tier 0 (Anonymous)**: [US1 Validation](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/validation/T011-T014-US1-anonymous-support.md)
- [ ] **Tier 1 (Email)**: [US3 Validation (T025-T028)](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/validation/T025-T028-US3-progressive-signup.md)
- [ ] **Tier 2 (OAuth)**: [US3 Validation (T025-T028)](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/validation/T025-T028-US3-progressive-signup.md)
- [ ] **Dual-Mode Support**: [US2 Validation](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/validation/T018-T021-US2-dual-mode-support.md)
- [ ] **Accessibility**: [US4 Validation](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/validation/T033-T036-US4-accessibility-support.md)
- [ ] **Offline Mode**: [US5 Validation](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/validation/T041-T044-US5-offline-mode.md)

---

**Design Freeze Commit**: [5b2a756](https://github.com/assadsharif/Hackathon_01/commit/5b2a756)
**Last Updated**: 2025-12-27
