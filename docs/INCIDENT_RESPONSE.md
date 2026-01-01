# Incident Response Guide - ChatKit Widget

**Phase 13E: Observability & Operations**
**Version**: v0.4.0
**Last Updated**: 2026-01-01

---

## Incident Classification

| Severity | Definition | Response Time | Escalation |
|----------|------------|---------------|------------|
| **P0 - Critical** | Complete service outage | Immediate | Page on-call immediately |
| **P1 - High** | Major feature broken, affecting >50% users | < 15 min | Notify team lead |
| **P2 - Medium** | Feature degraded, affecting <50% users | < 1 hour | Slack #chatkit-incidents |
| **P3 - Low** | Minor issue, workaround available | Next business day | Create ticket |

---

## Incident Response Process

### 1. Detection

**Automated Alerts**:
- Health check fails (Pingdom/UptimeRobot)
- Error rate > 5% (metrics monitoring)
- Response time > 1000ms
- Database connectivity lost

**Manual Reports**:
- User support tickets
- Slack reports
- Monitoring dashboards

### 2. Triage (< 5 minutes)

**Checklist**:
- [ ] Classify severity (P0/P1/P2/P3)
- [ ] Check `/health` endpoint status
- [ ] Check `/metrics` for error_rate
- [ ] Review last 10 log entries
- [ ] Determine scope (all users vs. specific users)

**Commands**:
```bash
# Quick health check
curl http://localhost:8000/health | jq .

# Quick metrics check
curl http://localhost:8000/metrics | jq .

# Last 10 errors
grep '"level":"ERROR"' /var/log/chatkit-backend.log | tail -10 | jq .
```

### 3. Initial Response (< 15 minutes)

**P0 - Critical Outage**:
1. **Page on-call** immediately
2. **Create incident channel**: `#incident-YYYYMMDD-description`
3. **Post status update**: Public status page + Twitter
4. **Check runbook**: See [OPS_RUNBOOK.md](./OPS_RUNBOOK.md) for common scenarios

**P1 - High Severity**:
1. **Notify team lead** in Slack
2. **Create incident channel**
3. **Begin investigation** using runbook
4. **Post update** every 30 minutes

**P2/P3**:
1. **Create ticket** in issue tracker
2. **Assign to team**
3. **Follow standard workflow**

### 4. Investigation

**Gather Context**:
- **Request IDs** from user reports
- **Time range** of incident
- **Affected endpoints** from logs
- **Recent deployments** (last 24h)

**Log Analysis**:
```bash
# Get all errors in time range
grep '"level":"ERROR"' /var/log/chatkit-backend.log | \
  jq 'select(.timestamp >= "2026-01-01T12:00:00Z" and .timestamp <= "2026-01-01T13:00:00Z")'

# Group by event type
grep '"level":"ERROR"' /var/log/chatkit-backend.log | \
  jq -r '.event' | sort | uniq -c | sort -rn

# Get specific request ID details
grep "abc123def456" /var/log/chatkit-backend.log | jq .
```

**Common Root Causes**:
- Database connectivity lost
- Rate limits too restrictive
- Deployment bugs
- External service failures
- Configuration errors

### 5. Mitigation

**Rollback** (if recent deployment):
```bash
# Rollback to previous tag
git checkout v0.3.1-security-complete
systemctl restart chatkit-backend

# Verify health
curl http://localhost:8000/health
```

**Configuration Fix**:
```bash
# Adjust rate limits (see OPS_RUNBOOK.md §3)
# Adjust CORS settings
# Rotate secrets if compromised

systemctl restart chatkit-backend
```

**Database Fix**:
```bash
# Restart database
systemctl restart postgresql

# Verify connectivity
psql $DATABASE_URL -c "SELECT 1;"
```

### 6. Resolution

**Verify Fix**:
- [ ] `/health` returns 200
- [ ] `/metrics` shows error_rate < 1%
- [ ] Test affected user flows
- [ ] Monitor for 30 minutes

**Communicate Resolution**:
- Post update to incident channel
- Update status page
- Notify affected users (if P0/P1)
- Close incident ticket

### 7. Post-Mortem (P0/P1 only)

**Within 48 hours**, create post-mortem:

**Template**:
```markdown
# Incident Post-Mortem: [TITLE]

**Date**: 2026-01-01
**Duration**: 45 minutes (12:15 - 13:00 UTC)
**Severity**: P0
**Impact**: Complete service outage, 100% users affected

## Timeline
- 12:15 - Incident detected (health check failed)
- 12:17 - On-call paged
- 12:20 - Root cause identified (database connection pool exhausted)
- 12:25 - Mitigation applied (restarted database)
- 12:30 - Service restored
- 13:00 - Verified stable

## Root Cause
Database connection pool exhausted due to unclosed connections in new analytics service.

## Impact
- 2,300 requests failed
- 150 users affected
- $0 revenue loss (free tier)

## Resolution
1. Restarted database (immediate fix)
2. Fixed connection leak in analytics_service.py
3. Added connection pool monitoring

## Prevention
- [ ] Add database connection pool alerts
- [ ] Code review for connection handling
- [ ] Load testing before deployment

## Action Items
- [ ] Engineering: Add connection pool metrics (@alice, by 2026-01-03)
- [ ] Ops: Configure Datadog alert for pool usage (@bob, by 2026-01-02)
- [ ] QA: Add connection leak tests (@charlie, by 2026-01-05)
```

---

## Communication Templates

### Status Update (Incident Ongoing)

**Twitter/Status Page**:
```
🔴 Investigating: ChatKit widget experiencing [brief description]
Affected: [All users / Specific feature]
Started: [Time] UTC
Updates: Every 30 min

Reference: INC-20260101-001
```

**Slack (#incidents)**:
```
🔥 P0 INCIDENT

**Status**: Investigating
**Impact**: Complete outage
**Affected**: All users
**Started**: 2026-01-01 12:15 UTC

**Current Actions**:
- Checking database connectivity
- Reviewing recent deployments

**Next Update**: 12:45 UTC

**Incident Channel**: #incident-20260101-database-down
**Incident Commander**: @alice
```

### Resolution Announcement

**Twitter/Status Page**:
```
✅ Resolved: ChatKit service restored
Duration: 45 minutes
Cause: Database connection issue
Fix: Connection pool increased

We apologize for the disruption. Post-mortem available at [link]
```

**Slack (#incidents)**:
```
✅ RESOLVED - INC-20260101-001

**Duration**: 45 minutes (12:15 - 13:00 UTC)
**Root Cause**: Database connection pool exhausted
**Fix**: Restarted database + deployed connection fix

**Post-Mortem**: Due by 2026-01-03
**Action Items**: 3 (see incident doc)

Thanks to @alice, @bob, @charlie for quick response!
```

---

## Escalation Paths

### Normal Hours (9am - 6pm PST)

1. **P0**: Page on-call → Team Lead → CTO
2. **P1**: Slack team → Team Lead
3. **P2/P3**: Create ticket → Assign to team

### After Hours

1. **P0 Only**: Page on-call (PagerDuty)
2. **P1/P2/P3**: Wait until business hours

### External Dependencies

**Third-Party Service Failures**:
- **Database (AWS RDS)**: AWS Support ticket
- **Email (SendGrid)**: SendGrid Support
- **Hosting (Vercel)**: Vercel Support

**Vendor Contact**:
- Maintain vendor contact list in runbook
- SLA expectations documented
- Escalation paths defined

---

## Runbook Integration

**Before responding**, check [OPS_RUNBOOK.md](./OPS_RUNBOOK.md) for:
- §1: Service won't start
- §2: Auth failures
- §3: Rate limiting
- §4: Token leakage
- §5: High error rate
- §6: Database issues
- §7: Widget not loading

**80% of incidents** are covered by runbook procedures.

---

## Tools & Access

**Required Access**:
- Server SSH access
- Database credentials
- PagerDuty account
- Slack admin (incident channels)
- Status page admin
- Cloud provider console

**Monitoring Tools**:
- `/health` endpoint
- `/metrics` endpoint
- Log aggregation (grep/jq)
- Database monitoring
- APM (future: DataDog/New Relic)

---

## Training & Drills

**Monthly Gameday**:
- Simulate P0 incident
- Practice incident response
- Test escalation paths
- Review runbook accuracy

**New Team Member Onboarding**:
- Shadow incident response
- Review post-mortems
- Practice log analysis
- Get tool access

---

**End of Incident Response Guide**

For operational procedures, see [OPS_RUNBOOK.md](./OPS_RUNBOOK.md).
For observability features, see [OBSERVABILITY_GUIDE.md](./OBSERVABILITY_GUIDE.md).
