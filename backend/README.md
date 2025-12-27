# ChatKit RAG Backend

**Phase**: 7B - Backend Skeleton (Mock)
**Purpose**: Validate contract wiring (NO vector DB, NO LLM yet)

---

## Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## Run Server

```bash
cd backend
uvicorn app.main:app --reload
```

Server runs at: http://localhost:8000

---

## API Endpoints

### POST /api/v1/chat

**Mock RAG endpoint** - returns static response matching contract.

**Request**:
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is embodied AI?",
    "context": {
      "mode": "browse",
      "session_id": "550e8400-e29b-41d4-a716-446655440000"
    },
    "tier": "anonymous"
  }'
```

**Response**:
```json
{
  "answer": "Mock response from backend. Your question was: 'What is embodied AI?'",
  "sources": [
    {
      "id": "mock-source-1",
      "title": "Mock Chapter: Physical AI Introduction",
      "url": "/docs/mock-page",
      "excerpt": "This is a mock source excerpt for testing...",
      "score": 0.92
    }
  ],
  "metadata": {
    "model": "mock-model",
    "tokens_used": 150,
    "retrieval_time_ms": 95,
    "generation_time_ms": 650,
    "total_time_ms": 745
  }
}
```

### GET /health

**Health check endpoint**

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

---

## Interactive API Docs

FastAPI auto-generates docs:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Contract Validation

This backend implements:
- ✅ `specs/phase-7b/rag-api.contract.md` (request/response shapes)
- ✅ Pydantic validation (message length, UUID format, etc.)
- ✅ CORS enabled (for widget → backend calls)
- ❌ Vector DB integration (Phase 7B-3)
- ❌ LLM integration (Phase 7B-3)
- ❌ Rate limiting (Phase 7B-4)

---

## What's NOT Implemented Yet

- ❌ Vector DB (Qdrant) - will add in Phase 7B-3
- ❌ LLM (OpenAI/Claude) - will add in Phase 7B-3
- ❌ Rate limiting per tier - will add in Phase 7B-4
- ❌ Session management - will add in Phase 7C
- ❌ Authentication - will add in Phase 7C

**This is purely contract validation wiring.**

---

**Last Updated**: 2025-12-27
