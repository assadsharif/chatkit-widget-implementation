# Backend Sanity Test Procedure - Phase 10

## Prerequisites

1. **Create Virtual Environment**:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

2. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

3. **Initialize Database**:
```bash
python create_tables.py
```

## Test Procedure

### Test 1: Create User
```bash
# Start server
uvicorn app.main:app --reload

# In another terminal, test signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "consent_data_storage": true
  }'

# Expected: {"status":"verification_sent"}
# Check backend console for verification token
```

### Test 2: Verify Email & Create Session
```bash
# Use token from console output
curl -X POST http://localhost:8000/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_FROM_CONSOLE"
  }'

# Expected: {
#   "session_token": "...",
#   "user_profile": {"email": "test@example.com", "tier": "lightweight"}
# }
# Save session_token for next steps
```

### Test 3: Save Chat
```bash
# Use session_token from previous step
curl -X POST http://localhost:8000/api/v1/chat/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "Test message 1"},
      {"role": "assistant", "content": "Test response 1"}
    ],
    "title": "Test Chat"
  }'

# Expected: {
#   "chat_id": "1",
#   "saved_at": "2025-12-28T..."
# }
```

### Test 4: Personalize
```bash
curl -X POST http://localhost:8000/api/v1/user/personalize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "preferences": {"difficulty_level": "beginner"}
  }'

# Expected: {
#   "recommendations": [...],
#   "personalized_content": {...}
# }
```

### Test 5: Analytics Event
```bash
# Anonymous event
curl -X POST http://localhost:8000/api/v1/analytics/event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_view",
    "event_data": {"page": "/docs"}
  }'

# Authenticated event
curl -X POST http://localhost:8000/api/v1/analytics/event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "event_type": "button_click",
    "event_data": {"button": "save_chat"}
  }'

# Expected: {
#   "event_id": 1,
#   "logged_at": "2025-12-28T..."
# }
```

### Test 6: Backend Restart (DATA PERSISTENCE TEST) ✅

**CRITICAL**: This is the quality gate.

```bash
# 1. Stop the server (Ctrl+C)

# 2. Restart the server
uvicorn app.main:app --reload

# 3. Verify session still works
curl -X GET http://localhost:8000/api/v1/auth/session-check \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Expected: {
#   "valid": true,
#   "user": {"email": "test@example.com", "tier": "lightweight"}
# }

# 4. Verify data persists
# Check database file exists: ls chatkit.db
# Database should contain all data from previous steps
```

### Test 7: Session Refresh
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh-token \
  -H "Authorization: Bearer YOUR_OLD_SESSION_TOKEN"

# Expected: {
#   "token": "NEW_SESSION_TOKEN"
# }
```

## Pass Criteria

✅ All API endpoints return expected responses
✅ Database file (`chatkit.db`) is created
✅ **DATA PERSISTS after backend restart** (CRITICAL)
✅ Session tokens work across restarts
✅ Saved chats are retrievable
✅ Analytics events are logged to database

## Failure Indicators

❌ 500 Internal Server Error → Check database connection
❌ Data lost after restart → Database not persisting
❌ Session invalid after restart → Session not saved to DB
❌ Import errors → Missing dependencies

## Database Inspection

```bash
# Install SQLite browser (optional)
sqlite3 chatkit.db

# List tables
.tables

# Check users
SELECT * FROM users;

# Check sessions
SELECT * FROM sessions;

# Check saved chats
SELECT * FROM saved_chats;

# Check analytics events
SELECT * FROM analytics_events;

# Exit
.quit
```

## Expected Database Tables

After running `create_tables.py`, you should have:

- users
- sessions
- verification_tokens
- saved_chats
- anonymous_sessions
- rate_limits
- analytics_events

## Cleanup (Optional)

```bash
# Remove database (fresh start)
rm chatkit.db

# Recreate tables
python create_tables.py
```

---

**Status**: Backend ready for testing. Requires virtual environment setup and dependency installation.
