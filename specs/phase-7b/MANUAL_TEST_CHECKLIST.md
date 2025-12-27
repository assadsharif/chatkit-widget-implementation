# Phase 7B Manual Test Checklist

**Purpose**: Step-by-step manual validation of widget ↔ backend integration.

**Tester**: ___________
**Date**: ___________
**Environment**: ___________

---

## Pre-Test Setup

- [ ] Backend running: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload`
- [ ] Backend health check: `curl http://localhost:8000/health` → `{"status":"ok"}`
- [ ] Widget built: `npm run build` → No errors
- [ ] Browser: Open `test.html` in Chrome/Firefox/Safari
- [ ] DevTools: Open Console tab (F12)

---

## Test 1: Happy Path - Simple Message

**Steps**:
1. Type "What is embodied AI?" in input field
2. Click "Send" button

**Expected**:
- [ ] User message appears (blue, right-aligned)
- [ ] Loading message "Thinking..." appears (italic, gray)
- [ ] Loading message disappears
- [ ] Backend response appears (gray, left-aligned)
- [ ] Response text: "Mock response from backend. Your question was: 'What is embodied AI?'"
- [ ] No console errors

**Actual**: ___________

---

## Test 2: Session ID Persistence

**Steps**:
1. Open DevTools → Network tab
2. Send message "Test 1"
3. Check request payload → Note `session_id`
4. Send message "Test 2"
5. Check request payload → Note `session_id`

**Expected**:
- [ ] Both requests have same `session_id`
- [ ] `session_id` is valid UUID v4 (8-4-4-4-12 format)

**Actual**:
- Session ID (Test 1): ___________
- Session ID (Test 2): ___________
- Match: [ ] Yes [ ] No

---

## Test 3: Contract Validation - Request Shape

**Steps**:
1. Open DevTools → Network tab
2. Send message "Test contract"
3. Click failed request → "Payload" tab

**Expected Request Shape**:
```json
{
  "message": "Test contract",
  "context": {
    "mode": "browse",
    "session_id": "[UUID]"
  },
  "tier": "anonymous"
}
```

**Checklist**:
- [ ] `message` field present and correct
- [ ] `context.mode` = "browse"
- [ ] `context.session_id` is UUID v4
- [ ] `tier` = "anonymous"
- [ ] No extra fields

**Actual**: ___________

---

## Test 4: Contract Validation - Response Shape

**Steps**:
1. Open DevTools → Network tab
2. Send any message
3. Click request → "Response" tab

**Expected Response Shape**:
```json
{
  "answer": "Mock response from backend...",
  "sources": [
    {
      "id": "mock-source-1",
      "title": "Mock Chapter: Physical AI Introduction",
      "url": "/docs/mock-page",
      "excerpt": "This is a mock source excerpt...",
      "score": 0.92
    }
  ],
  "metadata": {
    "model": "mock-model",
    "tokens_used": 150,
    "retrieval_time_ms": 95,
    "generation_time_ms": 650,
    "total_time_ms": [NUMBER]
  }
}
```

**Checklist**:
- [ ] `answer` field present
- [ ] `sources` array present (length ≥1)
- [ ] `sources[0]` has id, title, url, excerpt, score
- [ ] `metadata` has model, tokens_used, retrieval_time_ms, generation_time_ms, total_time_ms

**Actual**: ___________

---

## Test 5: Error Handling - Empty Message

**Steps**:
1. Leave input field empty
2. Click "Send" button

**Expected**:
- [ ] Nothing happens (no network request)
- [ ] No error message displayed
- [ ] Input field still empty

**Actual**: ___________

---

## Test 6: Error Handling - Message Too Long

**Steps**:
1. Type message >2000 characters (paste lorem ipsum)
2. Click "Send"

**Expected**:
- [ ] User message appears
- [ ] Loading state appears briefly
- [ ] Error message: "Your message is too long. Please keep it under 2000 characters."
- [ ] No backend request sent (check Network tab)

**Actual**: ___________

---

## Test 7: Error Handling - Backend Offline

**Steps**:
1. Stop backend server (Ctrl+C)
2. Send message "Test offline"

**Expected**:
- [ ] User message appears
- [ ] Loading state appears
- [ ] Loading state disappears
- [ ] Error message: "Unable to connect to the service. Please check your connection."
- [ ] Console shows network error (expected)

**Actual**: ___________

---

## Test 8: Error Handling - Backend 400 Error

**Steps**:
1. Restart backend
2. Manually send invalid request (use curl):
   ```bash
   curl -X POST http://localhost:8000/api/v1/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "", "context": {"mode": "browse", "session_id": "invalid"}, "tier": "anonymous"}'
   ```

**Expected**:
- [ ] Backend returns 400 with error object
- [ ] Error has `code`, `message`, `details` fields

**Actual**: ___________

---

## Test 9: Loading State Timing

**Steps**:
1. Send message
2. Observe loading indicator

**Expected**:
- [ ] Loading appears immediately after user message
- [ ] Loading visible for ~500-1000ms (network dependent)
- [ ] Loading removed before backend response shown
- [ ] No orphaned "Thinking..." messages

**Actual**: ___________

---

## Test 10: Multiple Messages in Sequence

**Steps**:
1. Send "Message 1"
2. Wait for response
3. Send "Message 2"
4. Wait for response
5. Send "Message 3"
6. Wait for response

**Expected**:
- [ ] All 3 messages appear in order
- [ ] All 3 responses appear in order
- [ ] No race conditions (responses match questions)
- [ ] Scroll automatically to bottom

**Actual**: ___________

---

## Test 11: Rapid Fire Messages

**Steps**:
1. Send "Fast 1" → Immediately send "Fast 2" → Immediately send "Fast 3"
2. Do NOT wait for responses

**Expected**:
- [ ] All 3 user messages appear
- [ ] All 3 loading states appear
- [ ] All 3 responses eventually appear
- [ ] Responses match order of questions
- [ ] No dropped messages

**Actual**: ___________

**Note**: If race conditions occur, document and defer fix to Phase 7B-5.

---

## Test 12: Browser Console - Zero Errors

**Steps**:
1. Clear console
2. Perform Test 1 (happy path)
3. Check console

**Expected**:
- [ ] No errors (red text)
- [ ] No warnings (yellow text) related to widget
- [ ] Only info/debug logs (if any)

**Actual**: ___________

---

## Test 13: Memory Leak Check (Basic)

**Steps**:
1. Open DevTools → Performance → Memory
2. Take heap snapshot #1
3. Send 10 messages
4. Take heap snapshot #2
5. Compare

**Expected**:
- [ ] Heap size increase is reasonable (<5MB)
- [ ] No detached DOM nodes from widget

**Actual**: ___________

**Note**: Full memory profiling deferred to Hardening phase.

---

## Test 14: Cross-Browser Compatibility (Optional)

**Browsers to Test**:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

**Expected**: All tests pass in all browsers

**Actual**: ___________

---

## Sign-Off

**All Tests Passed**: [ ] Yes [ ] No

**Blocker Issues**: ___________

**Non-Blocker Issues**: ___________

**Phase 7B Activation**: [ ] APPROVED [ ] BLOCKED

**Tester Signature**: ___________
**Date**: ___________

---

**Last Updated**: 2025-12-27
