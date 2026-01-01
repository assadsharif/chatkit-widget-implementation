# Production Deployment Guide - Railway

**Platform**: Railway.app
**Version**: v0.4.0-observability-complete
**Date**: 2026-01-01

---

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **Railway CLI**: Install from https://docs.railway.app/develop/cli
3. **Git**: Ensure repository is clean and committed
4. **Production Secrets**: Generate SECRET_KEY (see below)

---

## Quick Start (Automated Deployment)

### Step 1: Install Railway CLI

```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# Verify installation
railway version
```

### Step 2: Login to Railway

```bash
railway login
# Opens browser for authentication
```

### Step 3: Create New Project

```bash
cd /path/to/chatkit-widget-implementation
railway init
# Follow prompts:
# - Project name: chatkit-backend-production
# - Environment: production
```

### Step 4: Add PostgreSQL Database

```bash
railway add
# Select: PostgreSQL
# Railway will automatically set DATABASE_URL environment variable
```

### Step 5: Generate Production Secrets

```bash
# Generate SECRET_KEY
python3 -c 'import secrets; print(secrets.token_urlsafe(32))'
# Copy output (e.g., "abc123...")
```

### Step 6: Set Environment Variables

```bash
# Set SECRET_KEY (replace with generated value)
railway variables set SECRET_KEY="your-generated-secret-key-here"

# Set INTEGRATION_TEST_MODE to false
railway variables set INTEGRATION_TEST_MODE=false

# Set CORS_ORIGINS (will update after getting Railway URL)
railway variables set CORS_ORIGINS="https://chatkit-backend-production.up.railway.app"

# Optional: Email configuration
railway variables set SMTP_HOST="smtp.gmail.com"
railway variables set SMTP_PORT="587"
railway variables set FROM_EMAIL="noreply@yourdomain.com"
```

### Step 7: Deploy Backend

```bash
# Deploy to Railway
railway up

# Railway will:
# 1. Build the application
# 2. Install dependencies (requirements.txt)
# 3. Run database migrations
# 4. Start the server (uvicorn)
```

### Step 8: Get Production URL

```bash
# Get deployment URL
railway open
# Opens browser with Railway dashboard

# Or get URL via CLI
railway domain
# Example output: chatkit-backend-production.up.railway.app
```

### Step 9: Update CORS_ORIGINS

```bash
# Update CORS with actual Railway domain
railway variables set CORS_ORIGINS="https://chatkit-backend-production.up.railway.app"

# Redeploy for changes to take effect
railway up
```

### Step 10: Verify Deployment

```bash
# Health check
curl https://chatkit-backend-production.up.railway.app/health

# Expected output:
# {"status":"ok","database":"connected","uptime_seconds":123}

# Metrics check
curl https://chatkit-backend-production.up.railway.app/metrics

# Expected output:
# {"total_requests":0,"error_count":0,...}
```

---

## Manual Deployment (Railway Web UI)

### Option 1: Deploy from GitHub

1. **Connect GitHub Repository**:
   - Go to https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select `chatkit-widget-implementation`
   - Railway auto-detects Python app

2. **Configure Service**:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Add PostgreSQL**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically links DATABASE_URL

4. **Set Environment Variables**:
   - Go to Variables tab
   - Add:
     - `SECRET_KEY`: (generate with `python3 -c 'import secrets; print(secrets.token_urlsafe(32))'`)
     - `INTEGRATION_TEST_MODE`: `false`
     - `CORS_ORIGINS`: `https://your-railway-domain.railway.app`

5. **Generate Domain**:
   - Settings → Networking → Generate Domain
   - Copy generated domain (e.g., `chatkit-backend-production.up.railway.app`)

6. **Update CORS_ORIGINS**:
   - Variables → Edit CORS_ORIGINS with actual domain
   - Save (triggers redeploy)

7. **Verify**:
   - Open `https://your-domain.railway.app/health`
   - Should return `{"status":"ok",...}`

---

## Database Setup

### Automatic (Railway PostgreSQL)

Railway automatically:
- Creates PostgreSQL instance
- Sets `DATABASE_URL` environment variable
- Connects backend to database

### Manual Database Migration

If tables don't auto-create:

```bash
# SSH into Railway container
railway run bash

# Run table creation
python3 -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"

# Exit
exit
```

---

## Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | ✅ Yes | `abc123...` | 256-bit random key for sessions |
| `DATABASE_URL` | ✅ Yes | `postgresql://...` | Auto-set by Railway |
| `INTEGRATION_TEST_MODE` | ✅ Yes | `false` | MUST be false in production |
| `CORS_ORIGINS` | ✅ Yes | `https://chatkit.railway.app` | Comma-separated allowed origins |
| `SMTP_HOST` | ⚠️ Optional | `smtp.gmail.com` | Email server (for verification emails) |
| `SMTP_PORT` | ⚠️ Optional | `587` | Email server port |
| `SMTP_USER` | ⚠️ Optional | `noreply@example.com` | Email username |
| `SMTP_PASSWORD` | ⚠️ Optional | `***` | Email password |
| `FROM_EMAIL` | ⚠️ Optional | `noreply@example.com` | Sender email address |
| `BASE_URL` | ⚠️ Optional | `https://frontend.com` | Frontend URL (for email links) |

---

## Frontend Widget Deployment

### Option 1: Serve from Same Railway Instance

```bash
# Add static file serving to FastAPI (main.py)
from fastapi.staticfiles import StaticFiles

app.mount("/widget", StaticFiles(directory="../packages/widget/dist"), name="widget")
```

Widget URL: `https://your-domain.railway.app/widget/chatkit-widget.js`

### Option 2: Deploy to Static Hosting (Recommended)

**Vercel** (Recommended for widget):
```bash
cd packages/widget
npm run build

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
# Outputs: https://chatkit-widget.vercel.app/chatkit-widget.js
```

**Netlify**:
```bash
cd packages/widget
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

---

## Post-Deployment Checklist

### Critical (Must Complete)

- [ ] Health endpoint returns 200: `curl https://your-domain.railway.app/health`
- [ ] Metrics endpoint accessible: `curl https://your-domain.railway.app/metrics`
- [ ] Database connected (check health response: `"database":"connected"`)
- [ ] SECRET_KEY is NOT default value (check Railway variables)
- [ ] INTEGRATION_TEST_MODE is `false` (check Railway variables)
- [ ] CORS_ORIGINS includes Railway domain (check Railway variables)

### Recommended

- [ ] Set up uptime monitoring (Pingdom, UptimeRobot, Railway built-in)
- [ ] Configure log retention (Railway automatic)
- [ ] Review OPS_RUNBOOK.md with team
- [ ] Test widget integration with production backend
- [ ] Set up alerting for error_rate > 5% (Railway webhooks or external)

### Optional

- [ ] Configure custom domain (Railway Settings → Networking → Custom Domain)
- [ ] Enable automatic deployments (Railway Settings → Deployments → Auto-deploy on push)
- [ ] Set up staging environment (duplicate Railway project)
- [ ] Configure email sending (SMTP variables)

---

## Monitoring & Observability

### Railway Built-In Monitoring

**Metrics Dashboard**:
- CPU usage
- Memory usage
- Network traffic
- Deployment history

**Logs**:
- Real-time logs in Railway dashboard
- Structured JSON logs (Phase 13B)
- Search by request ID

**Access**:
```bash
# View logs
railway logs

# Follow logs (real-time)
railway logs --follow
```

### Health Check Monitoring (External)

**UptimeRobot** (Free):
1. Sign up at https://uptimerobot.com
2. Add Monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.railway.app/health`
   - Interval: 5 minutes
   - Alert when: Status code != 200

**Pingdom** (Paid):
1. Sign up at https://pingdom.com
2. Add HTTP Check:
   - URL: `https://your-domain.railway.app/health`
   - Check frequency: 1 minute
   - Alert contacts: Email, SMS

---

## Troubleshooting

### Deployment Fails

**Symptom**: Railway build fails

**Check**:
```bash
# View build logs
railway logs --deployment <deployment-id>

# Common issues:
# - requirements.txt missing dependencies
# - Python version mismatch
# - Database connection failure
```

**Fix**:
- Ensure all dependencies in `requirements.txt`
- Check Python version (Railway uses Python 3.11 by default)
- Verify DATABASE_URL is set

### Health Check Returns 500

**Symptom**: `/health` returns `{"status":"degraded","database":"disconnected"}`

**Cause**: Database not connected

**Fix**:
```bash
# Verify DATABASE_URL is set
railway variables

# Check PostgreSQL service status
railway services
# Ensure PostgreSQL service is "RUNNING"

# Restart backend
railway restart
```

### CORS Errors in Browser

**Symptom**: Frontend can't connect to backend (CORS error in console)

**Cause**: CORS_ORIGINS doesn't include frontend domain

**Fix**:
```bash
# Update CORS_ORIGINS
railway variables set CORS_ORIGINS="https://backend.railway.app,https://frontend.vercel.app"

# Redeploy
railway up
```

### SECRET_KEY Warning

**Symptom**: Startup logs show SECRET_KEY warning

**Cause**: SECRET_KEY not set or using default value

**Fix**:
```bash
# Generate new SECRET_KEY
python3 -c 'import secrets; print(secrets.token_urlsafe(32))'

# Set in Railway
railway variables set SECRET_KEY="your-generated-key"

# Restart
railway restart
```

---

## Rollback Procedure

### Rollback to Previous Deployment

```bash
# List deployments
railway deployments

# Rollback to specific deployment
railway rollback <deployment-id>
```

### Rollback to Previous Git Tag

```bash
# Checkout previous tag
git checkout v0.3.1-security-complete

# Deploy
railway up

# Return to latest
git checkout main
```

---

## Cost Estimate

**Railway Free Tier** (Hobby Plan):
- $5/month credit (includes)
- 512 MB RAM
- Shared CPU
- PostgreSQL included
- **Sufficient for:**
  - Low-traffic applications (<10,000 requests/month)
  - Development/staging environments
  - MVP deployments

**Railway Pro Plan** ($20/month):
- $20/month credit
- Up to 8 GB RAM
- Dedicated CPU
- **Recommended for:**
  - Production applications
  - >10,000 requests/month
  - Business-critical services

**PostgreSQL Add-On**:
- Included in free tier (1 GB storage)
- Scales automatically with plan

---

## Security Best Practices

### Production Secrets

✅ **DO**:
- Generate unique SECRET_KEY for production
- Use Railway's environment variables (encrypted at rest)
- Rotate secrets periodically (quarterly)

❌ **DON'T**:
- Commit secrets to Git
- Reuse development secrets in production
- Share secrets via Slack/email

### Database Security

✅ **DO**:
- Use Railway-provided DATABASE_URL (encrypted connection)
- Enable automatic backups (Railway Pro)
- Restrict database access to Railway network only

❌ **DON'T**:
- Expose database publicly
- Use weak database passwords
- Store sensitive data unencrypted

### HTTPS/SSL

✅ **Railway provides**:
- Automatic SSL certificates (Let's Encrypt)
- HTTPS enforced by default
- Auto-renewal of certificates

---

## Next Steps After Deployment

1. **Widget Integration**:
   - Update widget baseURL to production backend
   - Deploy widget to static hosting (Vercel/Netlify)
   - Test end-to-end flow

2. **Monitoring**:
   - Set up UptimeRobot health checks
   - Configure alerting (email/Slack)
   - Review metrics daily (first week)

3. **Performance**:
   - Monitor avg_response_ms (target: <200ms)
   - Check error_rate_percent (target: <1%)
   - Optimize database queries if needed

4. **Team Onboarding**:
   - Share Railway dashboard access
   - Review OPS_RUNBOOK.md
   - Practice incident response (gameday)

---

## Support & Resources

**Railway Documentation**: https://docs.railway.app
**ChatKit Runbooks**:
- [OPS_RUNBOOK.md](./OPS_RUNBOOK.md)
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
- [OBSERVABILITY_GUIDE.md](./OBSERVABILITY_GUIDE.md)

**Railway Support**:
- Discord: https://discord.gg/railway
- Twitter: @Railway

---

**Deployment Guide Version**: 1.0
**Last Updated**: 2026-01-01
**Compatible with**: v0.4.0-observability-complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
