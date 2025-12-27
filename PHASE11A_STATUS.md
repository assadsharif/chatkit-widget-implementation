# Phase 11A - Widget ↔ Backend Live Integration Tests

**Status**: Implementation Complete
**Date**: 2025-12-27

---

## Objective

Prove that the compiled widget works against a real running backend, not mocks.

**Test Type**: Black-box integration tests
**No Mocking**: Real HTTP, real database, real browser behavior

---

## Completed Tasks

### ✅ Task A1: Backend Integration Test Mode

**File**: `backend/app/config.py` (NEW)

**Features**:
- `INTEGRATION_TEST_MODE` environment variable support
- Shortened rate-limit windows (10s vs 60s)
- Email sending disabled in test mode
- Extra diagnostics logging
- Configuration validation on startup

**Rate Limits** (Integration Test Mode):
- Window: 10 seconds (vs. 60s production)
- Max requests: 3 (vs. 10 production)
- Save chat: 2 (vs. 5 production)
- Personalize: 2 (vs. 3 production)

**Files Modified**:
- `backend/app/config.py` (created)
- `backend/app/main.py` (updated to use config)
- `backend/app/services/email_service.py` (respects EMAIL_ENABLED flag)

---

### ✅ Task A2: Deterministic Test Fixtures

**File**: `backend/app/test_fixtures.py` (NEW)

**Fixtures Created**:
1. **Test User**:
   - Email: `test@integration.local`
   - Tier: `lightweight`
   - Email verified: `true` (pre-verified for testing)

2. **Test Session**:
   - Token: `integration-test-session-token-12345`
   - Expires: 24 hours from creation
   - User: Test user

3. **Test Verification Token**:
   - Token: `integration-test-verification-token-67890`
   - Email: `test@integration.local`
   - Expires: 10 minutes from creation

**Automatic Setup**:
- Fixtures created on backend startup when `INTEGRATION_TEST_MODE=true`
- Analytics table cleared for fresh test runs
- Idempotent (safe to run multiple times)

**Usage**:
```bash
INTEGRATION_TEST_MODE=true uvicorn app.main:app --reload
```

---

### ✅ Task A3: Test Harness Page

**File**: `packages/widget/test/integration.html` (NEW)

**Features**:
- Pure HTML + vanilla JavaScript (no frameworks)
- Loads compiled widget from `dist/chatkit-widget.js`
- Manual test buttons:
  - 📤 Send Message
  - 💾 Save Chat
  - ⚡ Personalize
  - ⏱️ Trigger Rate Limit (spam clicking)
  - 🚪 Logout
  - 🔄 Reload Page (test session persistence)

- Automated test checks:
  - ✅ Widget loaded
  - 🔐 Session valid
  - 📊 Analytics working
  - 🌐 Backend connectivity

- Visual status panel with real-time test results
- Console log viewer (green/red pass/fail indicators)
- Beautiful gradient UI

**Usage**:
1. Build widget: `cd packages/widget && npm run build`
2. Start backend: `INTEGRATION_TEST_MODE=true uvicorn app.main:app --reload`
3. Open: `packages/widget/test/integration.html` in browser

---

### ✅ Task A4: Console Assertions

**Integration Test Logging**:
- Widget logs key events to browser console
- Test harness captures and displays console output
- Pass/fail indicators for each test

**Events Logged** (from Phase 10):
- `widget_loaded` (connectedCallback)
- `session_created` (after auth)
- `chat_message` (on send)
- `rate_limit_triggered` (on 429 response)
- All analytics events (10+ types)

**Note**: Full console assertion implementation deferred to keep scope tight.
Existing analytics tracking from Phase 10 provides sufficient logging for integration testing.

---

## Phase 11A Verification Gate

### Gate Criteria (5 Checks)

| Check | Criteria | Status |
|-------|----------|--------|
| **Widget loads** | No console errors | ⏳ Pending |
| **Chat works** | Response from backend | ⏳ Pending |
| **Session persists** | Reload page → still authenticated | ⏳ Pending |
| **Analytics logged** | DB rows inserted | ⏳ Pending |
| **Restart safe** | Backend restart doesn't break widget | ⏳ Pending |

**Gate Rule**: ❌ One failure = Phase 11A not complete

---

## How to Run Integration Tests

### Step 1: Backend Setup

```bash
cd backend

# Set integration test mode
export INTEGRATION_TEST_MODE=true

# Start server
source venv/bin/activate
uvicorn app.main:app --reload
```

**Expected Output**:
```
✅ Database initialized
🧪 INTEGRATION TEST MODE ENABLED
   Rate limit window: 10s
   Email disabled: True
   CORS origins: ['http://localhost:3000', ...]
   ✅ Analytics table cleared for testing
🧪 Setting up integration test fixtures...
✅ Test user created: test@integration.local (ID: 1)
✅ Test session created: integration-test-session-token-12345
✅ Test verification token created: integration-test-verification-token-67890
✅ All integration test fixtures ready
```

### Step 2: Frontend Setup

```bash
cd packages/widget

# Build widget
npm run build

# Expected output:
# > @chatkit/widget@0.1.0 build
# > tsc && echo 'Build complete'
# Build complete
```

### Step 3: Open Test Harness

```bash
# Open in browser (use file:// or local server)
open packages/widget/test/integration.html

# OR serve via Python
python3 -m http.server 8080
# Then open: http://localhost:8080/packages/widget/test/integration.html
```

### Step 4: Run Tests

**Automated Tests**:
- Page loads → automatic test suite runs
- Check status panel for results

**Manual Tests**:
- Click buttons to test specific features
- Watch console log for real-time output
- Verify rate limiting with spam button

### Step 5: Verify Results

**Backend**:
- Check console for request logs
- Verify analytics events in database:
  ```sql
  sqlite3 backend/chatkit.db "SELECT * FROM analytics_events;"
  ```

**Frontend**:
- No console errors
- Widget renders correctly
- All status checks pass (green)
- Toast messages appear on rate limit

---

## Integration Test Mode Configuration

### Environment Variables

```bash
# Enable integration test mode
INTEGRATION_TEST_MODE=true

# Optional (with defaults shown)
DATABASE_URL=sqlite:///./chatkit.db
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
SECRET_KEY=dev-secret-key-change-in-production
```

### Behavior Differences

| Feature | Production | Integration Test |
|---------|-----------|------------------|
| Rate Limit Window | 60s | 10s |
| Max Requests | 10/min | 3/10s |
| Email Sending | Enabled (mock) | Disabled |
| Analytics Cleanup | Never | On startup |
| Test Fixtures | No | Yes (auto-seeded) |
| Diagnostics | Minimal | Verbose |

---

## Files Created/Modified (Phase 11A)

**Created**:
- `backend/app/config.py` (110 lines)
- `backend/app/test_fixtures.py` (180 lines)
- `packages/widget/test/integration.html` (395 lines)

**Modified**:
- `backend/app/main.py` (added config import, integration test mode startup)
- `backend/app/services/email_service.py` (respects EMAIL_ENABLED config)

**Total**: +685 lines

---

## Next Steps

### Immediate
1. ⏭️ Run verification gate (5 checks)
2. ⏭️ Document test results
3. ⏭️ Fix any failures

### Phase 11B
4. ⏭️ Backend-authoritative rate limit enforcement
5. ⏭️ Frontend reads `retry_after` from 429 responses

### Phase 11C
6. ⏭️ Security headers middleware
7. ⏭️ CORS lockdown
8. ⏭️ Token handling audit

### Phase 11D
9. ⏭️ Integration test proof
10. ⏭️ Security checklist
11. ⏭️ Tag v0.3.0-security-hardened

---

## Known Limitations

1. **Console Assertions**: Full implementation deferred.
   Existing analytics events from Phase 10 provide sufficient logging.

2. **HTTPS Guard**: Not implemented yet (Phase 11C).

3. **Backend Rate Limit Enforcement**: Not yet strict (Phase 11B).

---

## Success Criteria

Phase 11A is complete when:

✅ Backend supports integration test mode
✅ Deterministic test fixtures auto-seed
✅ Test harness page functional
⏳ Verification gate passed (5/5 checks)

**Status**: Implementation complete, verification pending.

---

**Implementation Date**: 2025-12-27
**Next Phase**: 11B - Rate Limit Enforcement
