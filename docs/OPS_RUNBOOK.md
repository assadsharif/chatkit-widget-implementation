# Operations Runbook - ChatKit Widget Backend

**Phase 13E: Observability & Operations**
**Version**: v0.4.0
**Last Updated**: 2026-01-01

---

## Purpose

This runbook provides step-by-step procedures for common operational scenarios. Use this when things break at 3 AM and you need answers fast.

**Principle**: If it breaks, we know what, where, and why — without guessing.

---

## Quick Reference

| Scenario | Page |
|----------|------|
| Service won't start | [§1](#1-service-wont-start) |
| Users report auth failures | [§2](#2-users-report-authentication-failures) |
| Rate limit complaints | [§3](#3-rate-limit-complaints) |
| Suspected token leakage | [§4](#4-suspected-token-leakage) |
| High error rate | [§5](#5-high-error-rate) |
| Database connectivity issues | [§6](#6-database-connectivity-issues) |

---

## 1. Service Won't Start

**Symptoms**:
- Backend crashes on startup
- Health check fails immediately
- Error logs show configuration issues

**Diagnosis**:

```bash
# Check logs for startup errors
tail -n 100 /var/log/chatkit-backend.log | grep FATAL

# Common errors:
# - "❌ FATAL: SECRET_KEY environment variable is not set"
# - "❌ FATAL: DATABASE_URL environment variable is not set"
```

**Resolution**:

### 1a. Missing SECRET_KEY

**Cause**: SECRET_KEY not set or using default value in production.

**Fix**:
```bash
# Generate a secure secret key
export SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')

# Add to environment permanently
echo "export SECRET_KEY=$SECRET_KEY" >> ~/.bashrc

# Restart service
systemctl restart chatkit-backend
```

**Verification**:
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok", "database": "connected", "uptime_seconds": ...}
```

### 1b. DATABASE_URL Missing/Invalid

**Cause**: Database connection string not set or incorrect.

**Fix**:
```bash
# Check current DATABASE_URL
echo $DATABASE_URL

# Set DATABASE_URL (PostgreSQL example)
export DATABASE_URL="postgresql://user:password@localhost:5432/chatkit"

# Or for development (SQLite)
export DATABASE_URL="sqlite:///./chatkit.db"

# Restart service
systemctl restart chatkit-backend
```

**Verification**:
```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check health endpoint
curl http://localhost:8000/health
```

---

## 2. Users Report Authentication Failures

**Symptoms**:
- Login attempts fail with 401
- Session check returns unauthorized
- Token refresh fails

**Diagnosis**:

```bash
# Get user's request ID from support ticket
REQUEST_ID="abc123..."

# Search logs for that request
grep "$REQUEST_ID" /var/log/chatkit-backend.log | jq .

# Look for:
# - "event": "token_expired"
# - "event": "invalid_session"
# - "event": "rate_limit_exceeded"
```

**Resolution**:

### 2a. Expired Sessions

**Cause**: User session > 24 hours old (SESSION_EXPIRY_HOURS=24).

**Fix**: User must log in again (expected behavior).

**Response to User**:
```
Your session has expired for security. Please log in again.
```

### 2b. Invalid/Corrupted Tokens

**Cause**: Token format invalid or SECRET_KEY changed.

**Check**:
```bash
# Did SECRET_KEY change recently?
grep "SECRET_KEY" /etc/environment

# Check session table for user
sqlite3 chatkit.db "SELECT * FROM sessions WHERE user_id = 'USER_ID';"
```

**Fix**:
```bash
# If SECRET_KEY changed: All users must re-authenticate
# Clear all sessions (nuclear option)
sqlite3 chatkit.db "DELETE FROM sessions WHERE created_at < datetime('now', '-1 hour');"

# Notify users of forced logout
```

### 2c. Rate Limiting

**Check metrics**:
```bash
curl http://localhost:8000/metrics | jq .rate_limit_hits
```

**If rate limit hits > 100/hour**: Possible bot/abuse.

**Fix**:
- Review rate limit settings in `config.py`
- Check IP addresses in logs
- Consider IP-based blocking

---

## 3. Rate Limit Complaints

**Symptoms**:
- Legitimate users hitting rate limits
- Complaints of "Too many requests" errors
- High `rate_limit_hits` in `/metrics`

**Diagnosis**:

```bash
# Check current rate limit hits
curl http://localhost:8000/metrics | jq .rate_limit_hits

# Search logs for rate limit events
grep "rate_limit_exceeded" /var/log/chatkit-backend.log | jq -r '.user_id' | sort | uniq -c | sort -rn

# Top offenders:
#   15 user_abc123
#    8 user_def456
#    3 user_ghi789
```

**Resolution**:

### 3a. Legitimate High Usage

**Cause**: Power users hitting default limits.

**Fix**: Adjust rate limits in `backend/app/config.py`:

```python
# Before (production defaults)
RATE_LIMIT_WINDOW_SECONDS = 60   # 1 minute
RATE_LIMIT_MAX_REQUESTS = 10     # 10 requests per minute
RATE_LIMIT_SAVE_CHAT = 5         # 5 saves per minute

# After (relaxed for power users)
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 20     # Doubled
RATE_LIMIT_SAVE_CHAT = 10        # Doubled
```

**Restart required**: Yes

### 3b. Bot/Abuse Detection

**Cause**: Automated scraping or abuse.

**Check**:
```bash
# Get top request IDs for a user
grep "user_abc123" /var/log/chatkit-backend.log | jq -r '.request_id' | head -20

# Check request patterns
grep "user_abc123" /var/log/chatkit-backend.log | jq -r '.event' | sort | uniq -c
```

**Fix**:
- Ban abusive user (manual intervention)
- Add IP-based rate limiting (future enhancement)
- Report to abuse team

---

## 4. Suspected Token Leakage

**Symptoms**:
- Tokens appearing in logs
- Support tickets with visible tokens
- Unauthorized access using stolen tokens

**Diagnosis**:

```bash
# Search logs for potential token leaks
grep -i "token" /var/log/chatkit-backend.log | grep -v "\[REDACTED\]"

# Expected: No results (all tokens should be redacted)
# If results found: CRITICAL - tokens are leaking
```

**Resolution**:

### 4a. Tokens in Logs (CRITICAL)

**Immediate Action**:
1. **Rotate SECRET_KEY** (forces all sessions invalid):
   ```bash
   export SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
   systemctl restart chatkit-backend
   ```

2. **Notify all users** of forced logout

3. **Clear leaked logs**:
   ```bash
   # Archive old logs
   tar -czf /var/log/chatkit-backend-LEAKED-$(date +%Y%m%d).tar.gz /var/log/chatkit-backend.log

   # Truncate current logs
   > /var/log/chatkit-backend.log
   ```

4. **Root cause analysis**:
   - Check `backend/app/logger.py` for sanitization logic
   - Verify INTEGRATION_TEST_MODE=false in production
   - Review recent code changes

### 4b. Tokens in Frontend Console

**Check**:
- Open browser DevTools
- Look for `console.log` with tokens

**Expected**: No tokens logged (Phase 13A verification)

**If found**:
- Review `packages/widget/src/**/*.ts` for `console.log` statements
- File security incident report

---

## 5. High Error Rate

**Symptoms**:
- `/metrics` shows `error_rate_percent > 5%`
- User complaints of frequent errors
- Logs full of ERROR events

**Diagnosis**:

```bash
# Check current error rate
curl http://localhost:8000/metrics | jq .error_rate_percent

# Get top errors
grep '"level":"ERROR"' /var/log/chatkit-backend.log | jq -r '.event' | sort | uniq -c | sort -rn

# Example output:
#   45 unhandled_exception
#   23 database_error
#   12 rate_limit_exceeded
```

**Resolution**:

### 5a. Unhandled Exceptions

**Cause**: Application bugs, unexpected input, external service failures.

**Check specific error**:
```bash
grep '"event":"unhandled_exception"' /var/log/chatkit-backend.log | jq -r '.exception_type' | sort | uniq -c

# Example:
#   30 ValueError
#   15 TypeError
```

**Fix**:
- Review stack traces in logs
- Fix bugs in code
- Add input validation
- Deploy fix
- Monitor error rate decrease

### 5b. Database Errors

**Cause**: DB connectivity issues, query timeouts, deadlocks.

**Check health**:
```bash
curl http://localhost:8000/health | jq .database

# If "disconnected": Database is down
# If "connected": Check query performance
```

**Fix (PostgreSQL)**:
```bash
# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql $DATABASE_URL -c "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;"

# Kill long-running queries if needed
psql $DATABASE_URL -c "SELECT pg_terminate_backend(PID);"
```

---

## 6. Database Connectivity Issues

**Symptoms**:
- `/health` returns `"database": "disconnected"`
- 500 errors on all endpoints
- Logs show database errors

**Diagnosis**:

```bash
# Check health endpoint
curl http://localhost:8000/health | jq .

# Expected if DB down:
# {"status": "degraded", "database": "disconnected", "uptime_seconds": ...}

# Test database directly
psql $DATABASE_URL -c "SELECT 1;"
```

**Resolution**:

### 6a. Database Server Down

**Check status**:
```bash
# PostgreSQL
systemctl status postgresql

# If inactive:
systemctl start postgresql
```

**Verify**:
```bash
curl http://localhost:8000/health | jq .database
# Expected: "connected"
```

### 6b. Connection Pool Exhausted

**Cause**: Too many concurrent connections.

**Check**:
```bash
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# If close to max_connections (default 100): Pool exhausted
```

**Fix**:
- Increase `max_connections` in postgresql.conf
- Or reduce connection pool size in app
- Restart database

### 6c. Invalid DATABASE_URL

**Check**:
```bash
echo $DATABASE_URL
# Verify format: postgresql://user:password@host:port/database
```

**Fix**:
```bash
# Correct format
export DATABASE_URL="postgresql://chatkit_user:password@localhost:5432/chatkit_db"

systemctl restart chatkit-backend
```

---

## 7. Widget Not Loading (Frontend)

**Symptoms**:
- Widget shows blank screen
- HTTPS error displayed
- Network errors in console

**Diagnosis**:

1. **Check browser console** (F12):
   ```
   Look for:
   - "🔒 SECURITY ERROR: ChatKit widget requires HTTPS"
   - "Network error"
   - "Failed to fetch"
   ```

2. **Check request ID correlation**:
   - Get request ID from error UI
   - Search backend logs:
     ```bash
     grep "REQUEST_ID" /var/log/chatkit-backend.log | jq .
     ```

**Resolution**:

### 7a. HTTPS Error

**Cause**: Widget loaded over HTTP on non-localhost domain (Phase 12 security).

**Fix**: Enable HTTPS on hosting:
```bash
# Example: Let's Encrypt with certbot
certbot --nginx -d yourdomain.com

# Verify HTTPS
curl -I https://yourdomain.com
```

### 7b. CORS Error

**Check browser console**:
```
Access to fetch at 'http://localhost:8000/api/v1/chat' from origin
'https://yourdomain.com' has been blocked by CORS policy
```

**Fix**: Add domain to CORS_ORIGINS:
```bash
export CORS_ORIGINS="https://yourdomain.com,http://localhost:3000"

systemctl restart chatkit-backend
```

---

## 8. Metrics Interpretation

**Endpoint**: `GET /metrics`

**Healthy Baseline**:
```json
{
  "total_requests": 1543,
  "error_count": 12,
  "error_rate_percent": 0.78,    // < 1% is good
  "rate_limit_hits": 45,
  "avg_response_ms": 127.45,     // < 200ms is good
  "uptime_seconds": 86400
}
```

**Red Flags**:
- `error_rate_percent > 5%`: Investigate errors (see §5)
- `avg_response_ms > 500ms`: Performance degradation
- `rate_limit_hits` growing rapidly: Possible abuse (see §3)

---

## Emergency Contacts

**On-Call Rotation**: [Link to PagerDuty/schedule]

**Escalation**:
1. Primary: Backend Team Lead
2. Secondary: DevOps Engineer
3. Escalation: CTO

**Incident Slack**: `#chatkit-incidents`

---

## Appendix: Log Formats

### Structured Log Example

```json
{
  "timestamp": "2026-01-01T12:34:56.789Z",
  "level": "ERROR",
  "service": "chatkit-backend",
  "event": "rate_limit_exceeded",
  "request_id": "abc123def456",
  "user_id": "user_789",
  "endpoint": "/chat/save",
  "retry_after": 17
}
```

### Request ID Correlation

**Frontend** → **Backend** → **Logs**:
1. Frontend generates UUID: `abc123def456`
2. Sent in header: `X-Request-ID: abc123def456`
3. Backend echoes in response header: `X-Request-ID: abc123def456`
4. All logs include: `"request_id": "abc123def456"`

**To debug**:
```bash
# User reports error with reference ID: abc123def456
grep "abc123def456" /var/log/chatkit-backend.log | jq .
```

---

**End of Runbook**

For incident response procedures, see [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md).
For observability features, see [OBSERVABILITY_GUIDE.md](./OBSERVABILITY_GUIDE.md).
