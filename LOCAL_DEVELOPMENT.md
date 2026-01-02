# Local Development Guide

**Version**: v0.4.0-observability-complete
**Purpose**: Run ChatKit backend locally for development
**Database Stack**: Neon (Postgres) + Qdrant (Vector DB)

---

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- ✅ Python 3.11+ installed
- ✅ Neon database created (see `docs/NEON_SETUP_GUIDE.md`)
- ✅ Qdrant cluster created (see `docs/QDRANT_SETUP_GUIDE.md`)

### Step 1: Set Up Environment

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables

Create `backend/.env` file:

```bash
# Copy template
cat > backend/.env << 'EOF'
# Backend Configuration
SECRET_KEY=dev-secret-key-change-in-production
INTEGRATION_TEST_MODE=false

# Neon Serverless PostgreSQL
DATABASE_URL=postgresql://neondb_owner:npg_bEMG4OHC3ukS@ep-bold-heart-a1ehngm7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

# Qdrant Cloud Vector Database
QDRANT_URL=https://6ad62949-ff51-466d-8398-33f60317440a.europe-west3-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.1J4Nh3v5GmK73ZzOyfNpb8QquAB6T6v9gXU2r2sSA9w
QDRANT_COLLECTION=physical_ai_course

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIM=384

# CORS (allow localhost for development)
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
EOF
```

**Note**: Your actual credentials are already in the template above.

### Step 3: Run Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend running at**: http://localhost:8000

---

## ✅ Verify Backend is Working

### 1. Health Check

Open browser: http://localhost:8000/health

**Expected**:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime_seconds": 123
}
```

### 2. API Documentation

Open browser: http://localhost:8000/docs

**Expected**: Interactive Swagger UI with all API endpoints

### 3. Qdrant Status

```bash
curl http://localhost:8000/api/v1/qdrant/status
```

**Expected**:
```json
{
  "status": "connected",
  "collection": "physical_ai_course",
  "vectors_count": 0
}
```

---

## 🔧 Development Workflow

### Hot Reload

The `--reload` flag enables auto-reload on code changes:

1. Edit files in `backend/app/`
2. Save
3. Backend automatically restarts
4. Refresh browser to see changes

### View Logs

Backend logs appear in terminal:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started reloader process [12345]
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Database Migrations

Tables auto-create on first run. To reset:

```bash
# Connect to Neon via psql
psql "postgresql://neondb_owner:npg_bEMG4OHC3ukS@ep-bold-heart-a1ehngm7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Drop tables
DROP TABLE chat_sessions, anon_sessions, users;

# Restart backend - tables will recreate
```

---

## 🎨 Frontend Widget Development

### Run Widget Locally

```bash
cd packages/widget
npm install
npm run build
```

### Test Widget in Docusaurus

See `DOCUSAURUS_INTEGRATION.md` for complete guide.

---

## 🐛 Troubleshooting

### Port 8000 Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn app.main:app --reload --port 8001
```

### Database Connection Error

```bash
# Test Neon connection
psql "postgresql://neondb_owner:npg_bEMG4OHC3ukS@ep-bold-heart-a1ehngm7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# If fails: Check internet connection, verify DATABASE_URL in .env
```

### Qdrant Connection Error

```bash
# Test Qdrant connection
curl https://6ad62949-ff51-466d-8398-33f60317440a.europe-west3-0.gcp.cloud.qdrant.io:6333/collections \
  -H "api-key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.1J4Nh3v5GmK73ZzOyfNpb8QquAB6T6v9gXU2r2sSA9w"

# If fails: Check QDRANT_URL and QDRANT_API_KEY in .env
```

### Module Not Found

```bash
# Reinstall dependencies
pip install -r requirements.txt

# Verify virtual environment is activated
which python  # Should show venv/bin/python
```

---

## 📚 API Endpoints

### Authentication
- `POST /api/v1/anon-session` - Create anonymous session
- `POST /api/v1/signup` - Email signup
- `POST /api/v1/verify-email` - Verify email token

### Chat
- `POST /api/v1/chat` - Send chat message (RAG)
- `GET /api/v1/chat/history` - Get chat history
- `POST /api/v1/chat/save` - Save chat session

### Monitoring
- `GET /health` - Health check
- `GET /metrics` - Metrics (requests, errors, uptime)
- `GET /api/v1/qdrant/status` - Qdrant connection status

**Full API Docs**: http://localhost:8000/docs

---

## 🔐 Security Notes

### Development Mode
- ✅ CORS allows `localhost:3000` and `localhost:8000`
- ✅ DEBUG logging enabled
- ⚠️ SECRET_KEY is development key (change in production)

### Production Checklist
- [ ] Generate production SECRET_KEY: `python -c 'import secrets; print(secrets.token_urlsafe(32))'`
- [ ] Set `INTEGRATION_TEST_MODE=false`
- [ ] Update CORS_ORIGINS with production domains
- [ ] Use HTTPS for DATABASE_URL
- [ ] Rotate Qdrant API key quarterly

---

## 📦 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Environment config
│   ├── database.py          # Neon connection
│   ├── models.py            # SQLAlchemy models
│   ├── logger.py            # Structured logging
│   ├── middleware/
│   │   └── request_id.py    # Request tracing
│   └── services/
│       ├── email_service.py # Email verification
│       └── rag_client.py    # Qdrant + embeddings
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (create this)
└── venv/                    # Virtual environment (created by you)
```

---

## 🚀 Next Steps

1. **Import Course Content to Qdrant**
   - See `docs/QDRANT_SETUP_GUIDE.md` → "Data Import" section
   - Parse Physical AI book chapters
   - Generate embeddings
   - Upload to Qdrant

2. **Integrate Widget with Docusaurus**
   - See `DOCUSAURUS_INTEGRATION.md`
   - Add widget script to Docusaurus
   - Configure backend URL

3. **Test RAG Chatbot**
   - Ask questions about Physical AI
   - Verify responses use course content
   - Check citation accuracy

---

## 📞 Support

**Documentation**:
- Neon Setup: `docs/NEON_SETUP_GUIDE.md`
- Qdrant Setup: `docs/QDRANT_SETUP_GUIDE.md`
- Operations: `docs/OPS_RUNBOOK.md`

**Issues**:
- Backend not starting? Check logs in terminal
- Database errors? Verify .env credentials
- API errors? Check http://localhost:8000/docs

---

**Guide Version**: 1.0
**Last Updated**: 2026-01-02
**Compatible with**: v0.4.0-observability-complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
