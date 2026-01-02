# Railway Manual Deployment Guide - Web Interface

**Date**: 2026-01-02
**Version**: v0.4.0-observability-complete
**Method**: Railway Web Dashboard (No CLI Required)

---

## 🎯 Your Production Credentials (Ready to Use)

All credentials are pre-configured below. **Copy and paste exactly as shown.**

### Environment Variables (7 Total)

```bash
# 1. Neon PostgreSQL Connection
DATABASE_URL=postgresql://neondb_owner:npg_bEMG4OHC3ukS@ep-bold-heart-a1ehngm7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

# 2. Qdrant Vector Database URL
QDRANT_URL=https://6ad62949-ff51-466d-8398-33f60317440a.europe-west3-0.gcp.cloud.qdrant.io:6333

# 3. Qdrant API Key
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.1J4Nh3v5GmK73ZzOyfNpb8QquAB6T6v9gXU2r2sSA9w

# 4. Qdrant Collection Name
QDRANT_COLLECTION=physical_ai_course

# 5. Production Secret Key (256-bit, auto-generated)
SECRET_KEY=JmhyGfezEqzyU5Gw_NereKkr06SXyFHAHqclIVybQqI

# 6. Production Mode (MUST be false)
INTEGRATION_TEST_MODE=false

# 7. CORS Origins (UPDATE after deployment)
CORS_ORIGINS=https://chatkit-backend.railway.app
```

**⚠️ Note**: `CORS_ORIGINS` will be updated after deployment with your actual Railway domain.

---

## 📋 Step-by-Step Deployment

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click **"Start a New Project"** or **"Login"**
3. Sign up with:
   - GitHub (recommended)
   - Google
   - Email

### Step 2: Connect GitHub Repository

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub account
4. Search for: `chatkit-widget-implementation`
5. Click on the repository to select it

**If repository is private**:
- Railway will ask for additional permissions
- Grant access to the repository

### Step 3: Configure Deployment

1. Railway will auto-detect the project
2. Click **"Add variables"** or **"Variables"** tab
3. You'll add environment variables in the next step

### Step 4: Add Environment Variables (Critical Step)

**Click "Variables" tab** in your Railway project, then **"New Variable"** for each:

#### Variable 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**:
```
postgresql://neondb_owner:npg_bEMG4OHC3ukS@ep-bold-heart-a1ehngm7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
```
- Click **"Add"**

#### Variable 2: QDRANT_URL
- **Name**: `QDRANT_URL`
- **Value**:
```
https://6ad62949-ff51-466d-8398-33f60317440a.europe-west3-0.gcp.cloud.qdrant.io:6333
```
- Click **"Add"**

#### Variable 3: QDRANT_API_KEY
- **Name**: `QDRANT_API_KEY`
- **Value**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.1J4Nh3v5GmK73ZzOyfNpb8QquAB6T6v9gXU2r2sSA9w
```
- Click **"Add"**

#### Variable 4: QDRANT_COLLECTION
- **Name**: `QDRANT_COLLECTION`
- **Value**: `physical_ai_course`
- Click **"Add"**

#### Variable 5: SECRET_KEY
- **Name**: `SECRET_KEY`
- **Value**:
```
JmhyGfezEqzyU5Gw_NereKkr06SXyFHAHqclIVybQqI
```
- Click **"Add"**

#### Variable 6: INTEGRATION_TEST_MODE
- **Name**: `INTEGRATION_TEST_MODE`
- **Value**: `false`
- Click **"Add"**

#### Variable 7: CORS_ORIGINS (Temporary)
- **Name**: `CORS_ORIGINS`
- **Value**: `https://chatkit-backend.railway.app`
- Click **"Add"**
- **Note**: We'll update this in Step 7 with your actual domain

**Total Variables**: 7 (verify you added all 7)

### Step 5: Configure Build Settings

1. Go to **"Settings"** tab
2. Scroll to **"Build"** section
3. **Root Directory**: Leave blank (default)
4. **Build Command**: Leave blank (Railway auto-detects from `railway.json`)
5. **Start Command**: Should auto-detect as:
   ```
   cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

**If Start Command is blank**, add manually:
```
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Step 6: Deploy

1. Railway will automatically start deploying
2. Watch the **"Deployments"** tab for progress
3. Build takes 2-5 minutes (installing dependencies)
4. Look for: **"✓ Build Successful"** and **"✓ Deploy Successful"**

**If deployment fails**:
- Check **"Logs"** tab for errors
- Common issues:
  - Missing environment variables → Go back to Step 4
  - Wrong Python version → Railway uses Python 3.11 (should work)
  - Missing dependencies → Check `backend/requirements.txt`

### Step 7: Generate Domain & Update CORS

1. After successful deployment, go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Railway will create a domain like:
   ```
   https://chatkit-backend-production-abc123.up.railway.app
   ```
5. **Copy your domain**

6. Go back to **"Variables"** tab
7. Find `CORS_ORIGINS` variable
8. Click **"Edit"** (pencil icon)
9. Update value to your actual domain:
   ```
   https://chatkit-backend-production-abc123.up.railway.app
   ```
10. Click **"Update"**
11. Railway will automatically redeploy (takes 30 seconds)

---

## ✅ Verification Steps

After deployment completes, verify everything is working:

### 1. Health Endpoint (Critical)

**Open in browser** (replace with your domain):
```
https://YOUR-DOMAIN.up.railway.app/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime_seconds": 123
}
```

**If you see this**: ✅ Neon database is connected!

**If you see error**:
- `"database": "disconnected"` → Check DATABASE_URL in Variables
- 500 error → Check Logs tab

### 2. Metrics Endpoint

**Open in browser**:
```
https://YOUR-DOMAIN.up.railway.app/metrics
```

**Expected Response**:
```json
{
  "total_requests": 0,
  "error_count": 0,
  "error_rate": 0.0,
  "rate_limit_hits": 0,
  "avg_response_ms": 0.0,
  "uptime_seconds": 123
}
```

### 3. Qdrant Status (New Endpoint)

**Test in terminal** (replace with your domain):
```bash
curl https://YOUR-DOMAIN.up.railway.app/api/v1/qdrant/status
```

**Expected Response**:
```json
{
  "status": "connected",
  "collection": "physical_ai_course",
  "vectors_count": 0
}
```

**If you see this**: ✅ Qdrant is connected!

**If error**:
- Check QDRANT_URL and QDRANT_API_KEY in Variables
- Verify Qdrant cluster is running at https://cloud.qdrant.io

### 4. Anonymous Session Creation

**Test user flow**:
```bash
curl -X POST https://YOUR-DOMAIN.up.railway.app/api/v1/anon-session
```

**Expected Response**:
```json
{
  "session_id": "...",
  "anon_id": "..."
}
```

### 5. Verify Environment Variables

In Railway dashboard:
1. Go to **"Variables"** tab
2. Check all 7 variables are set:
   - ✅ DATABASE_URL (starts with `postgresql://`)
   - ✅ QDRANT_URL (starts with `https://`)
   - ✅ QDRANT_API_KEY (JWT token)
   - ✅ QDRANT_COLLECTION (`physical_ai_course`)
   - ✅ SECRET_KEY (43+ character random string)
   - ✅ INTEGRATION_TEST_MODE (`false`)
   - ✅ CORS_ORIGINS (your Railway domain)

---

## 🔒 Security Checklist

After deployment, verify security:

- [ ] **HTTPS Enforced**: Your domain uses `https://` (Railway auto-SSL)
- [ ] **SECRET_KEY**: Not default value, 256-bit random
- [ ] **INTEGRATION_TEST_MODE**: Set to `false`
- [ ] **Neon SSL**: Connection uses `sslmode=require`
- [ ] **Qdrant Auth**: All requests require API key
- [ ] **CORS**: Only your domains allowed

---

## 📊 Monitor Your Deployment

### Railway Built-In Monitoring

1. Go to **"Observability"** tab in Railway
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### External Monitoring (Recommended)

**Set up UptimeRobot** (Free):
1. Go to https://uptimerobot.com
2. Sign up (free account)
3. Click **"Add New Monitor"**
4. Configure:
   - **Type**: HTTP(s)
   - **URL**: `https://YOUR-DOMAIN.up.railway.app/health`
   - **Interval**: 5 minutes
   - **Alert**: Email when status ≠ 200 or response doesn't contain "ok"

**Benefits**:
- 24/7 uptime monitoring
- Email/SMS alerts when service is down
- Response time tracking

---

## 🛠️ Troubleshooting

### Deployment Failed

**Check Logs**:
1. Railway dashboard → **"Deployments"** tab
2. Click on failed deployment
3. View **"Logs"** for error messages

**Common Errors**:

#### "Module not found"
```bash
ModuleNotFoundError: No module named 'qdrant_client'
```
**Fix**: Check `backend/requirements.txt` includes `qdrant-client==1.7.0`

#### "Database connection failed"
```bash
could not connect to server: Connection refused
```
**Fix**:
- Verify DATABASE_URL is correct (copy from Step 4)
- Check Neon database is running at https://console.neon.tech

#### "Qdrant connection failed"
```bash
Could not connect to Qdrant
```
**Fix**:
- Verify QDRANT_URL includes `:6333` port
- Check QDRANT_API_KEY is correct
- Verify Qdrant cluster is running at https://cloud.qdrant.io

### Health Endpoint Returns 500

**Symptom**: `/health` returns error 500

**Fix**:
1. Check Railway **"Logs"** tab
2. Look for database connection errors
3. Verify all environment variables are set (Step 4)
4. Restart deployment: Settings → Deployments → Click "Redeploy"

### CORS Errors in Browser

**Symptom**: Browser console shows "CORS policy" error

**Fix**:
1. Go to Railway **"Variables"** tab
2. Update `CORS_ORIGINS` with your actual Railway domain
3. Railway will auto-redeploy

---

## 📚 Next Steps

After successful deployment:

### 1. Import Physical AI Course Content to Qdrant

**See**: `docs/QDRANT_SETUP_GUIDE.md` → "Data Import" section

**Quick script** (create `scripts/import_course_content.py`):
```python
import os
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from sentence_transformers import SentenceTransformer

# Connect to Qdrant
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# Load embedding model
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Parse course content
chunks = [
    {
        "text": "Physical AI combines artificial intelligence with physical embodiment...",
        "chapter": "Module 1: Introduction",
        "url": "/docs/module-1/intro"
    },
    # Add more chunks from your Physical AI book
]

# Generate embeddings
texts = [c["text"] for c in chunks]
embeddings = model.encode(texts)

# Upload to Qdrant
points = [
    PointStruct(
        id=i,
        vector=embedding.tolist(),
        payload=chunk
    )
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
]

client.upsert(collection_name="physical_ai_course", points=points)
print(f"✓ Uploaded {len(points)} vectors to Qdrant")
```

### 2. Deploy Frontend Widget

**Options**:
- Vercel (recommended for static sites)
- Netlify
- Same Railway instance (add static file serving)

**See**: `docs/DEPLOYMENT_GUIDE.md` → "Widget Deployment" section

### 3. Set Up Monitoring

- ✅ UptimeRobot: https://uptimerobot.com (free, recommended)
- Railway Observability (built-in)
- Pingdom (paid, advanced features)

---

## 🎉 Deployment Complete!

**Your Production Stack**:
```
┌─────────────────────────────────────────┐
│  Railway (Backend)                      │
│  https://YOUR-DOMAIN.railway.app        │
└──────────┬─────────────────┬────────────┘
           │                 │
   ┌───────▼──────┐   ┌──────▼──────────┐
   │ Neon Postgres│   │ Qdrant Cloud    │
   │ (Singapore)  │   │ (Europe West)   │
   └──────────────┘   └─────────────────┘
```

**Verification Checklist**:
- [ ] Health endpoint returns 200 ✅
- [ ] Metrics endpoint accessible ✅
- [ ] Qdrant status endpoint returns "connected" ✅
- [ ] All 7 environment variables set ✅
- [ ] CORS_ORIGINS updated with actual domain ✅
- [ ] UptimeRobot monitoring configured ✅

**Your Backend is Live!** 🚀

---

**Guide Version**: 1.0 (Manual Deployment)
**Last Updated**: 2026-01-02
**Compatible with**: v0.4.0-observability-complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
