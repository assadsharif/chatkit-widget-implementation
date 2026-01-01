# Production Deployment Checklist

**Platform**: Railway
**Version**: v0.4.0-observability-complete
**Date**: 2026-01-01

---

## Pre-Deployment (Complete Before Running Script)

- [ ] **Railway Account Created**: Sign up at https://railway.app
- [ ] **Railway CLI Installed**:
  ```bash
  # macOS/Linux
  curl -fsSL https://railway.app/install.sh | sh

  # Windows
  iwr https://railway.app/install.ps1 | iex

  # Verify
  railway version
  ```
- [ ] **Git Repository Clean**: All changes committed
- [ ] **Python 3.6+ Installed**: For SECRET_KEY generation

---

## Automated Deployment (Run Script)

```bash
cd /path/to/chatkit-widget-implementation
./deploy-to-railway.sh
```

**The script will**:
1. ✅ Check Railway CLI installation
2. ✅ Authenticate with Railway (opens browser)
3. ✅ Generate production SECRET_KEY
4. ✅ Create Railway project
5. ⚠️ Prompt to add PostgreSQL (manual step)
6. ✅ Set environment variables
7. ✅ Deploy backend to Railway

---

## Manual Steps During Deployment

### Step 1: Add PostgreSQL Database

When prompted by the script:
1. Open Railway dashboard: `railway open`
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Wait 30-60 seconds for PostgreSQL to provision
4. Verify `DATABASE_URL` is set: `railway variables`
5. Return to terminal and press **Enter**

### Step 2: Generate Railway Domain

After deployment:
1. Open Railway dashboard: `railway open`
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Copy generated domain (e.g., `chatkit-backend-production.up.railway.app`)

### Step 3: Update CORS_ORIGINS

```bash
# Replace YOUR-DOMAIN with actual Railway domain
railway variables set CORS_ORIGINS="https://YOUR-DOMAIN.railway.app"

# Example:
railway variables set CORS_ORIGINS="https://chatkit-backend-production.up.railway.app"
```

Deployment will automatically restart with updated CORS settings.

---

## Post-Deployment Verification

### Critical Checks (Must Pass)

- [ ] **Health Endpoint Returns 200**:
  ```bash
  curl https://YOUR-DOMAIN.railway.app/health
  # Expected: {"status":"ok","database":"connected","uptime_seconds":123}
  ```

- [ ] **Metrics Endpoint Accessible**:
  ```bash
  curl https://YOUR-DOMAIN.railway.app/metrics
  # Expected: {"total_requests":0,"error_count":0,...}
  ```

- [ ] **Database Connected**:
  - Check health response: `"database":"connected"`
  - If `"disconnected"`: Verify PostgreSQL service is running

- [ ] **SECRET_KEY Not Default**:
  ```bash
  railway variables | grep SECRET_KEY
  # Should NOT be "dev-secret-key-change-in-production"
  ```

- [ ] **INTEGRATION_TEST_MODE is False**:
  ```bash
  railway variables | grep INTEGRATION_TEST_MODE
  # Must show: INTEGRATION_TEST_MODE=false
  ```

- [ ] **CORS_ORIGINS Correct**:
  ```bash
  railway variables | grep CORS_ORIGINS
  # Must include actual Railway domain
  ```

### Recommended Checks

- [ ] **View Deployment Logs**:
  ```bash
  railway logs
  # Look for:
  # - "✅ Database initialized"
  # - "✅ Security validation passed"
  # - No errors in startup
  ```

- [ ] **Test API Endpoints**:
  ```bash
  # Test anonymous session creation
  curl -X POST https://YOUR-DOMAIN.railway.app/api/v1/anon-session

  # Expected: {"session_id":"...", "anon_id":"..."}
  ```

- [ ] **Check Response Times**:
  ```bash
  # Should be < 500ms
  curl -w "@- Time: %{time_total}s\n" https://YOUR-DOMAIN.railway.app/health
  ```

---

## Monitoring Setup (Recommended)

### Option 1: UptimeRobot (Free)

1. Sign up: https://uptimerobot.com
2. Add Monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://YOUR-DOMAIN.railway.app/health`
   - **Interval**: 5 minutes
   - **Alert when**: Status code != 200 OR Response doesn't contain "ok"
   - **Alert contacts**: Your email

### Option 2: Railway Built-In

1. Open Railway dashboard
2. Go to **Observability** tab
3. Enable alerts for:
   - High CPU usage (> 80%)
   - High memory usage (> 90%)
   - Deployment failures

### Option 3: Pingdom (Paid)

1. Sign up: https://pingdom.com
2. Add HTTP Check with same settings as UptimeRobot
3. Check frequency: 1 minute
4. SMS/phone alerts available

---

## Widget Deployment (Frontend)

### Option 1: Deploy to Vercel (Recommended)

```bash
cd packages/widget
npm run build

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Update widget baseURL to production backend
# Edit chatkit-widget.ts:
# baseURL: 'https://YOUR-RAILWAY-DOMAIN.railway.app'
```

Widget URL: `https://chatkit-widget.vercel.app/chatkit-widget.js`

### Option 2: Deploy to Netlify

```bash
cd packages/widget
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: Serve from Railway (Same Instance)

Add to `backend/app/main.py`:
```python
from fastapi.staticfiles import StaticFiles

app.mount("/widget", StaticFiles(directory="../packages/widget/dist"), name="widget")
```

Widget URL: `https://YOUR-RAILWAY-DOMAIN.railway.app/widget/chatkit-widget.js`

---

## Widget Integration

Update widget configuration to use production backend:

```html
<!-- In your website -->
<script type="module">
  import { ChatKitWidget } from 'https://chatkit-widget.vercel.app/chatkit-widget.js';

  // Create widget with production backend
  const widget = new ChatKitWidget('https://YOUR-RAILWAY-DOMAIN.railway.app');

  // Add to page
  document.body.appendChild(widget);
</script>
```

Or use custom element:
```html
<script type="module" src="https://chatkit-widget.vercel.app/chatkit-widget.js"></script>
<chatkit-widget data-backend-url="https://YOUR-RAILWAY-DOMAIN.railway.app"></chatkit-widget>
```

---

## Troubleshooting

### Deployment Fails

**Check**:
```bash
railway logs --deployment <deployment-id>
```

**Common Issues**:
- Missing `requirements.txt` → Add all dependencies
- Python version mismatch → Railway uses Python 3.11
- Database connection failure → Verify PostgreSQL is running

### Health Check Returns 500

**Symptom**: `/health` returns `{"status":"degraded","database":"disconnected"}`

**Fix**:
```bash
# Verify PostgreSQL service
railway services
# Should show PostgreSQL as "RUNNING"

# Restart backend
railway restart
```

### CORS Errors

**Symptom**: Browser console shows "CORS policy" error

**Fix**:
```bash
# Verify CORS_ORIGINS includes frontend domain
railway variables | grep CORS_ORIGINS

# Update if needed
railway variables set CORS_ORIGINS="https://backend.railway.app,https://frontend.vercel.app"
```

### Widget Not Loading

**Check**:
1. Widget JavaScript URL accessible
2. Backend CORS allows frontend domain
3. HTTPS enabled (widget refuses HTTP in production)
4. Browser console for errors

---

## Rollback Procedure

If deployment fails or has issues:

```bash
# List recent deployments
railway deployments

# Rollback to previous deployment
railway rollback <deployment-id>

# Or rollback to previous git tag
git checkout v0.3.1-security-complete
railway up
git checkout main
```

---

## Security Verification

After deployment, verify security features:

- [ ] **HTTPS Enforced**: Widget refuses HTTP connections
- [ ] **Secrets Not Exposed**: `/metrics` doesn't leak secrets
- [ ] **Token Redaction**: Logs don't show tokens (check Railway logs)
- [ ] **Rate Limiting Active**: Test by making >20 requests/minute
- [ ] **Global Exception Handler**: Test with invalid endpoint (should return structured error)

---

## Cost & Scaling

**Railway Free Tier**:
- $5/month credit (includes)
- 512 MB RAM, shared CPU
- PostgreSQL included
- **Handles**: ~10,000 requests/month

**When to Upgrade** (Railway Pro - $20/month):
- Traffic > 10,000 requests/month
- Need dedicated CPU
- Require > 512 MB RAM
- Business-critical uptime required

---

## Next Steps After Deployment

1. **Monitor First Week**:
   - Check `/metrics` daily
   - Review error_rate_percent (target: < 1%)
   - Check avg_response_ms (target: < 200ms)

2. **Team Onboarding**:
   - Share Railway dashboard access
   - Review [OPS_RUNBOOK.md](./docs/OPS_RUNBOOK.md)
   - Practice incident response

3. **Optional Enhancements**:
   - Custom domain (Settings → Networking → Custom Domain)
   - Email sending (set SMTP variables)
   - Staging environment (duplicate Railway project)

---

## Support Resources

**Railway**:
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

**ChatKit**:
- [OPS_RUNBOOK.md](./docs/OPS_RUNBOOK.md) - Operational procedures
- [INCIDENT_RESPONSE.md](./docs/INCIDENT_RESPONSE.md) - Incident handling
- [OBSERVABILITY_GUIDE.md](./docs/OBSERVABILITY_GUIDE.md) - Monitoring guide
- [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) - Full deployment guide

---

**Checklist Version**: 1.0
**Last Updated**: 2026-01-01
**Compatible with**: v0.4.0-observability-complete

✅ **When all items checked**: Production deployment complete!

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
