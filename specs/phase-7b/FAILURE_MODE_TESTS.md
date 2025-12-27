# Phase 7B Failure Mode Tests

**Purpose**: Verify widget survives all error conditions gracefully.

**Requirement**: ❌ NO console errors allowed. Widget MUST survive.

---

## Test Cases

### Case 1: Backend Down

**Setup**:
1. Stop backend: `Ctrl+C` in backend terminal
2. Send message: "Test offline"

**Expected Behavior**:
- [ ] User message appears
- [ ] Loading state appears
- [ ] Loading state disappears
- [ ] Assistant message: "Unable to connect to the service. Please check your connection."
- [ ] Input remains enabled
- [ ] Widget functional for next message
- [ ] **NO console errors**

**Actual Result**: ___________

**Status**: [ ] PASS [ ] FAIL

---

### Case 2: 500 Internal Server Error

**Setup**:
1. Modify backend to return 500 error temporarily
2. Or use curl to simulate:
   ```bash
   # Manually inject 500 response (requires backend modification)
   ```

**Expected Behavior**:
- [ ] User message appears
- [ ] Loading state appears
- [ ] Loading state disappears
- [ ] Assistant message: User-friendly error (not raw 500)
- [ ] Widget functional for next message
- [ ] **NO console errors**

**Actual Result**: ___________

**Status**: [ ] PASS [ ] FAIL

**Note**: May require backend modification to test. Skip if not feasible.

---

### Case 3: Empty Response

**Setup**:
1. Modify backend to return empty answer:
   ```python
   answer=""
   ```
2. Or test with minimal response

**Expected Behavior**:
- [ ] User message appears
- [ ] Loading state appears
- [ ] Loading state disappears
- [ ] Assistant message appears (even if empty or placeholder)
- [ ] **NO crash**
- [ ] **NO console errors**

**Actual Result**: ___________

**Status**: [ ] PASS [ ] FAIL

---

### Case 4: Slow Response (3-5s)

**Setup**:
1. Add delay to backend:
   ```python
   import asyncio
   await asyncio.sleep(4)
   ```
2. Send message

**Expected Behavior**:
- [ ] User message appears
- [ ] Loading state appears
- [ ] Loading state persists for ~4 seconds
- [ ] Response appears after delay
- [ ] Input disabled during loading (optional)
- [ ] Spinner visible (optional)
- [ ] **NO timeout error** (unless >30s)
- [ ] **NO console errors**

**Actual Result**: ___________

**Status**: [ ] PASS [ ] FAIL

---

### Case 5: Network Offline

**Setup**:
1. Disconnect network (airplane mode or unplug ethernet)
2. Or use browser DevTools → Network → Offline
3. Send message

**Expected Behavior**:
- [ ] User message appears
- [ ] Loading state appears
- [ ] Network error caught
- [ ] Assistant message: "Unable to connect to the service. Please check your connection."
- [ ] Widget functional after reconnect
- [ ] **NO console errors** (network errors expected in DevTools but not unhandled)

**Actual Result**: ___________

**Status**: [ ] PASS [ ] FAIL

---

### Case 6: Malformed Response

**Setup**:
1. Backend returns invalid JSON or missing required fields
2. Example: `{"answer": "test"}` (missing sources, metadata)

**Expected Behavior**:
- [ ] Widget handles gracefully
- [ ] Either displays partial data OR error message
- [ ] **NO crash**
- [ ] **NO console errors**

**Actual Result**: ___________

**Status**: [ ] PASS [ ] FAIL

---

### Case 7: Rapid Repeated Failures

**Setup**:
1. Stop backend
2. Send 5 messages rapidly

**Expected Behavior**:
- [ ] All 5 user messages appear
- [ ] All 5 error messages appear
- [ ] **NO cascading failures**
- [ ] Widget remains functional
- [ ] **NO console errors**

**Actual Result**: ___________

**Status**: [ ] PASS [ ] FAIL

---

## Pass Criteria

**ALL tests must pass**:
- ✅ Widget survives every error condition
- ✅ User-friendly error messages (no raw HTTP codes)
- ✅ No console errors (network errors in DevTools are OK)
- ✅ Widget remains functional after errors
- ✅ Input enabled after error recovery

**Blockers**: Any console errors or widget crashes

---

## Test Results

**Tester**: ___________
**Date**: ___________
**Browser**: ___________

**Summary**:
- Tests Passed: ___ / 7
- Tests Failed: ___ / 7
- Blockers: ___________

**Sign-Off**: [ ] APPROVED [ ] BLOCKED

---

**Last Updated**: 2025-12-27
