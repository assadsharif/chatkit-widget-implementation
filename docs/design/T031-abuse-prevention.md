# T031 — Abuse Prevention (Design)

**Phase**: 5 (Design Only)
**Status**: ✅ Design Complete (No Implementation)

---

## Rate Limiting for Anonymous Users

**Rules**:
- 10 questions per minute (rolling window)
- 500 questions per day (24-hour window)
- Enforced server-side (cannot bypass)

**Exceeded Behavior**:
- 10/min: 60-second cooldown + signup CTA
- 500/day: Hard block until 24 hours pass + signup CTA

---

## Prompt Injection Safety

**Rules**:
- Backend validates message content
- System prompt injection detected and blocked
- Special characters sanitized (e.g., `{{`, `<script>`)
- Max message length: 2000 chars (enforced client + server)

**Detected Injection Behavior**:
- Message rejected with error: "Invalid input detected"
- No answer generated
- Attempt logged (analytics)

---

## Signup Bypass Prevention

**Rules**:
- Session ID uniqueness enforced
- Cannot create multiple anonymous sessions to bypass rate limits
- Browser fingerprinting (optional, privacy-sensitive)
- IP-based rate limiting (backup)

**Bypass Attempt Behavior**:
- Aggregate rate limits across sessions from same IP
- Temporary IP ban (1 hour) after repeated abuse
- Signup required to continue

---

**Last Updated**: 2025-12-27
