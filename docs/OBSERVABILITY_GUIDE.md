# Observability Guide - ChatKit Widget

**Phase 13: Observability & Operations**
**Version**: v0.4.0
**Last Updated**: 2026-01-01

---

## Overview

This guide explains the observability features implemented in Phase 13, enabling production operations teams to monitor, debug, and maintain the ChatKit Widget system.

**Goal**: If it breaks at 3 AM, we know what, where, and why — without guessing.

---

## Phase 13 Features

| Feature | Status | Documentation |
|---------|--------|---------------|
| **13A: Request Tracing** | ✅ Complete | [§1](#1-request-tracing--correlation-phase-13a) |
| **13B: Structured Logging** | ✅ Complete | [§2](#2-structured-logging-phase-13b) |
| **13C: Error Boundaries** | ✅ Complete | [§3](#3-error-boundaries-phase-13c) |
| **13D: Health/Metrics** | ✅ Complete | [§4](#4-health--metrics-endpoints-phase-13d) |

---

## 1. Request Tracing & Correlation (Phase 13A)

### Objective

Tie frontend action → backend request → log line → error with a single ID.

### How It Works

**Frontend**:
1. Widget generates UUID for each user action
2. Sent in `X-Request-ID` header on all HTTP requests
3. Example: `X-Request-ID: abc123-def456-789ghi`

**Backend**:
1. `RequestIDMiddleware` extracts/generates request ID
2. Attaches to `request.state.request_id`
3. Injects into `request_id_ctx` context variable
4. Echoes in response header: `X-Request-ID: abc123...`
5. All logs automatically include `request_id`

**Logs**:
```json
{
  "timestamp": "2026-01-01T12:34:56Z",
  "level": "ERROR",
  "event": "rate_limit_exceeded",
  "request_id": "abc123-def456-789ghi",  ← Automatic correlation
  "user_id": "user_123",
  "endpoint": "/chat/save"
}
```

### Usage

**User reports error with reference ID**:
```
User: "I got an error, reference ID: abc123-def456"
```

**Ops team investigates**:
```bash
# Search all logs for that request
grep "abc123-def456" /var/log/chatkit-backend.log | jq .

# Output: Full request lifecycle
# - Request received
# - Database query executed
# - Rate limit exceeded (ERROR)
# - Response sent with error
```

### Verification

**Test correlation**:
```bash
# Make request with custom request ID
curl -H "X-Request-ID: test-12345" http://localhost:8000/health

# Check logs
grep "test-12345" /var/log/chatkit-backend.log | jq .

# Expected: All log entries for this request have "request_id": "test-12345"
```

---

## 2. Structured Logging (Phase 13B)

### Objective

Logs are machine-readable, not vibes-readable.

### Log Format

**Before Phase 13B** (console prints):
```
📧 EMAIL SENT (Mock)
To: user@example.com
Token: abc123
```

**After Phase 13B** (structured JSON):
```json
{
  "timestamp": "2026-01-01T12:34:56.789Z",
  "level": "INFO",
  "service": "chatkit-backend",
  "event": "email_sent_mock",
  "request_id": "abc123-def456",
  "to_email": "user@example.com",
  "subject": "Verify Your Email",
  "verification_link": "[REDACTED]"
}
```

### Logger API

**File**: `backend/app/logger.py`

**Usage**:
```python
from app.logger import log

# Info level
log.info("user_authenticated", user_id="123", tier="lightweight")

# Warning level
log.warning("token_refresh_failed", reason="expired", user_id="123")

# Error level
log.error("rate_limit_exceeded", endpoint="/chat/save", retry_after=17)

# Debug level
log.debug("cache_hit", key="session_token_abc123")
```

**Features**:
- Automatic `request_id` injection (from Phase 13A context)
- Automatic secret/token redaction (Phase 12 security)
- ISO8601 timestamps
- Service name tagging
- JSON output (machine-parseable)

### Log Levels

| Level | Use Case | Examples |
|-------|----------|----------|
| **INFO** | Normal operations | user_authenticated, email_sent, chat_saved |
| **WARNING** | Unexpected but recoverable | token_refresh_failed, deprecated_api_used |
| **ERROR** | Failures requiring attention | rate_limit_exceeded, database_error |
| **DEBUG** | Detailed diagnostics | cache_hit, query_executed |

### Security Features

**Automatic Redaction**:
```python
log.info("debug_token", token="secret123", user_id="456")

# Output (token redacted):
{
  "event": "debug_token",
  "token": "[REDACTED]",  ← Automatic
  "user_id": "456"
}
```

**Redacted Fields**:
- `token`, `session_token`, `verification_token`
- `password`, `secret`, `api_key`
- `authorization`, `SECRET_KEY`, `DATABASE_URL`

### Log Analysis

**Common Queries**:

```bash
# All errors in last hour
grep '"level":"ERROR"' /var/log/chatkit-backend.log | jq .

# Group errors by type
grep '"level":"ERROR"' /var/log/chatkit-backend.log | jq -r '.event' | sort | uniq -c

# Specific user's activity
grep '"user_id":"123"' /var/log/chatkit-backend.log | jq .

# Requests to specific endpoint
grep '"/chat/save"' /var/log/chatkit-backend.log | jq .
```

---

## 3. Error Boundaries (Phase 13C)

### Objective

Failures are explicit, isolated, and user-safe.

### Backend: Global Exception Handler

**Implementation**: `backend/app/main.py` (line 79)

**Behavior**:
1. Catches all unhandled exceptions
2. Logs error with request ID and context
3. Returns structured JSON error
4. Never exposes stack traces to users

**Example**:

**Error occurs**:
```python
# Somewhere in code
raise ValueError("Invalid input")
```

**Log output**:
```json
{
  "level": "ERROR",
  "event": "unhandled_exception",
  "exception_type": "ValueError",
  "exception_message": "Invalid input",
  "request_id": "abc123",
  "request_method": "POST",
  "request_url": "/api/v1/chat/save"
}
```

**User response**:
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred. Please try again later.",
  "request_id": "abc123"
}
```

### Frontend: Error Handling

**Implementation**: `packages/widget/src/utils/error-boundary.ts`

**Features**:
- Extracts request ID from response headers
- Shows user-friendly error messages
- Displays reference ID for support tickets
- Handles network errors gracefully

**Example UI**:
```
┌─────────────────────────────────────┐
│ ⚠️  Server error. Please try again. │
│                                     │
│ Reference ID: abc123-def456         │
└─────────────────────────────────────┘
```

**Usage**:
```typescript
import { handleFetchError, createErrorUI } from './utils/error-boundary.js';

try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) {
    const { message, requestId } = await handleFetchError(response);
    // Show error UI with request ID
    widget.innerHTML = createErrorUI(message, requestId);
  }
} catch (error) {
  const { message } = handleNetworkError(error);
  widget.innerHTML = createErrorUI(message);
}
```

---

## 4. Health & Metrics Endpoints (Phase 13D)

### Health Endpoint

**URL**: `GET /health`

**Purpose**: Quick service status check for monitoring/load balancers.

**Response (Healthy)**:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime_seconds": 86400
}
```

**Response (Degraded)**:
```json
{
  "status": "degraded",
  "database": "disconnected",
  "uptime_seconds": 86400
}
```

**HTTP Status Codes**:
- `200 OK`: Service healthy
- `500 Internal Server Error`: Service degraded

**Monitoring Setup**:
```bash
# Pingdom/UptimeRobot configuration
URL: https://api.example.com/health
Method: GET
Expected Status: 200
Alert on: Non-200 status
Interval: 1 minute
```

### Metrics Endpoint

**URL**: `GET /metrics`

**Purpose**: Operational metrics for dashboard/alerting (NOT Prometheus cosplay).

**Response**:
```json
{
  "total_requests": 15432,
  "error_count": 120,
  "error_rate_percent": 0.78,
  "rate_limit_hits": 45,
  "avg_response_ms": 127.45,
  "uptime_seconds": 86400
}
```

**Metrics Explained**:

| Metric | Description | Good Value | Alert Threshold |
|--------|-------------|------------|-----------------|
| `total_requests` | Total HTTP requests handled | N/A | N/A |
| `error_count` | Total errors returned | Low | N/A |
| `error_rate_percent` | % of requests that errored | < 1% | > 5% |
| `rate_limit_hits` | Rate limit triggers | Low | Sudden spike |
| `avg_response_ms` | Avg response time (last 100 requests) | < 200ms | > 500ms |
| `uptime_seconds` | Server uptime | High | Frequent restarts |

**Dashboard Example** (Grafana/DataDog):
```sql
-- Error rate over time
SELECT error_rate_percent FROM metrics WHERE time > now() - 1h

-- Response time trend
SELECT avg_response_ms FROM metrics WHERE time > now() - 24h
```

**Alerting Rules**:
```yaml
# Example: DataDog alert
- name: High Error Rate
  query: avg(last_5m):avg:chatkit.error_rate_percent > 5
  message: "Error rate above 5%! Check logs."
  notify: ["#chatkit-alerts", "@oncall"]

- name: Slow Response Time
  query: avg(last_5m):avg:chatkit.avg_response_ms > 500
  message: "Response time degraded. Investigate."
  notify: ["#chatkit-alerts"]
```

---

## 5. Observability Stack

### Current (Phase 13)

**Built-In**:
- Request tracing (X-Request-ID)
- Structured JSON logs
- /health endpoint
- /metrics endpoint
- Error boundaries

**Log Storage**:
- File: `/var/log/chatkit-backend.log`
- Rotation: logrotate (daily)
- Retention: 30 days

**Tools**:
- `grep` + `jq` for log analysis
- `curl` for health/metrics checks
- Manual correlation via request IDs

### Future Enhancements (Post-Phase 13)

**APM (Application Performance Monitoring)**:
- DataDog / New Relic / Honeycomb
- Automatic tracing with OpenTelemetry
- Distributed tracing across services
- Real-time alerting

**Log Aggregation**:
- ELK Stack (Elasticsearch + Logstash + Kibana)
- Splunk
- CloudWatch Logs

**Metrics Collection**:
- Prometheus + Grafana
- DataDog metrics
- CloudWatch metrics

**Alerting**:
- PagerDuty integration
- Slack webhooks
- SMS/phone alerts

---

## 6. Quick Start for Ops Team

### Day 1: Basic Monitoring

**1. Set up health check**:
```bash
# Add to cron (every minute)
* * * * * curl -f http://localhost:8000/health || echo "Health check failed" | mail -s "ChatKit Down" ops@example.com
```

**2. Set up metrics dashboard**:
```bash
# Simple metrics script (run every 5 minutes)
*/5 * * * * curl -s http://localhost:8000/metrics | jq . >> /var/log/chatkit-metrics.log
```

**3. Set up log rotation**:
```bash
# /etc/logrotate.d/chatkit
/var/log/chatkit-backend.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    create 0644 www-data www-data
}
```

### Day 2: Log Analysis

**Learn jq basics**:
```bash
# Get all errors
cat /var/log/chatkit-backend.log | jq 'select(.level == "ERROR")'

# Group by event
cat /var/log/chatkit-backend.log | jq -r '.event' | sort | uniq -c

# Specific request ID
cat /var/log/chatkit-backend.log | jq 'select(.request_id == "abc123")'
```

### Day 3: Incident Response

1. Read [OPS_RUNBOOK.md](./OPS_RUNBOOK.md)
2. Read [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
3. Practice with test incident
4. Get access to all tools

---

## 7. Reference

**Configuration Files**:
- `backend/app/logger.py` - Structured logger
- `backend/app/middleware/request_id.py` - Request ID middleware
- `backend/app/main.py` - Health/metrics endpoints (lines 199-265)
- `packages/widget/src/utils/http.ts` - Frontend request ID injection
- `packages/widget/src/utils/error-boundary.ts` - Frontend error handling

**Documentation**:
- [OPS_RUNBOOK.md](./OPS_RUNBOOK.md) - Operational procedures
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) - Incident handling
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Phase 12 security features

**Related Phases**:
- Phase 12: Security hardening (token handling, HTTPS, secrets)
- Phase 11: Integration & hardening (rate limiting, testing)
- Phase 13: Observability & operations (this phase)

---

**End of Observability Guide**

For operational issues, see [OPS_RUNBOOK.md](./OPS_RUNBOOK.md).
For incidents, see [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md).
