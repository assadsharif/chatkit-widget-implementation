# RAG API Contract

**Phase**: 7B - RAG Connectivity
**Purpose**: Define request/response shapes for backend ↔ widget communication
**Design Reference**: [RAG Chatbot Patterns](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/rag-chatbot/patterns.md)

---

## Endpoint

```
POST /api/v1/chat
```

**Base URL**: TBD (local development vs production)

---

## Request Shape

### Headers

```http
Content-Type: application/json
Authorization: Bearer <optional-session-token>
```

**Notes**:
- `Authorization` header optional for Tier 0 (anonymous)
- Required for Tier 1+ (authenticated users)

### Body

```json
{
  "message": "What is embodied AI?",
  "context": {
    "mode": "browse" | "chat",
    "selected_text": "optional string if mode=chat with selection",
    "page_url": "optional current page URL for context",
    "session_id": "client-generated UUID"
  },
  "tier": "anonymous" | "lightweight" | "full" | "premium"
}
```

**Field Descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ Yes | User's question |
| `context.mode` | enum | ✅ Yes | "browse" (all content) or "chat" (selected text) |
| `context.selected_text` | string | ❌ No | Text user selected (if mode=chat) |
| `context.page_url` | string | ❌ No | Current page URL for context logging |
| `context.session_id` | string | ✅ Yes | Client-generated UUID for session tracking |
| `tier` | enum | ✅ Yes | User's authentication tier |

**Validation Rules**:
- `message`: 1-2000 characters, non-empty after trim
- `context.mode`: Must be "browse" or "chat"
- `context.selected_text`: Max 5000 characters (if provided)
- `context.session_id`: Valid UUID v4 format
- `tier`: Must be one of: "anonymous", "lightweight", "full", "premium"

---

## Response Shape (Success)

### Status Code

```
200 OK
```

### Headers

```http
Content-Type: application/json
```

### Body

```json
{
  "answer": "Embodied AI refers to artificial intelligence systems that have a physical presence...",
  "sources": [
    {
      "id": "stable-id-123",
      "title": "Chapter 2: Embodied AI Fundamentals",
      "url": "/docs/module-2-embodied/fundamentals",
      "excerpt": "...relevant snippet...",
      "score": 0.92
    }
  ],
  "metadata": {
    "model": "gpt-4",
    "tokens_used": 450,
    "retrieval_time_ms": 120,
    "generation_time_ms": 800,
    "total_time_ms": 920
  }
}
```

**Field Descriptions**:

| Field | Type | Description |
|-------|------|-------------|
| `answer` | string | AI-generated response (plain text, Markdown support later) |
| `sources` | array | Retrieved document chunks (max 5) |
| `sources[].id` | string | Stable-ID for citation (from design pattern 4) |
| `sources[].title` | string | Document/chapter title |
| `sources[].url` | string | Relative or absolute URL to source |
| `sources[].excerpt` | string | Relevant text snippet (max 200 chars) |
| `sources[].score` | float | Similarity score (0.0-1.0) |
| `metadata.model` | string | LLM model used (e.g., "gpt-4", "claude-3-opus") |
| `metadata.tokens_used` | int | Total tokens consumed |
| `metadata.*_time_ms` | int | Latency breakdown (retrieval, generation, total) |

---

## Response Shape (Error)

### Client Errors (4xx)

#### 400 Bad Request

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Message field is required",
    "details": {
      "field": "message",
      "constraint": "non_empty"
    }
  }
}
```

**Error Codes**:
- `INVALID_REQUEST` - Malformed JSON or missing required fields
- `MESSAGE_TOO_LONG` - Message exceeds 2000 characters
- `SELECTED_TEXT_TOO_LONG` - Selected text exceeds 5000 characters
- `INVALID_SESSION_ID` - Session ID not a valid UUID

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired session token",
    "details": null
  }
}
```

#### 429 Too Many Requests

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 60 seconds.",
    "details": {
      "retry_after": 60,
      "limit": "10 requests per minute (anonymous tier)"
    }
  }
}
```

**Rate Limits** (from frozen design):
- Anonymous: 10 requests/min
- Lightweight: 30 requests/min
- Full: 100 requests/min
- Premium: Unlimited

### Server Errors (5xx)

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again.",
    "details": null
  }
}
```

#### 503 Service Unavailable

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "RAG service is temporarily unavailable",
    "details": {
      "retry_after": 30
    }
  }
}
```

---

## Example Requests

### Example 1: Browse Mode (Anonymous)

**Request**:
```http
POST /api/v1/chat HTTP/1.1
Content-Type: application/json

{
  "message": "What is the difference between embodied and disembodied AI?",
  "context": {
    "mode": "browse",
    "page_url": "/docs/module-2-embodied/fundamentals",
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "tier": "anonymous"
}
```

**Response**:
```json
{
  "answer": "Embodied AI refers to systems with physical presence (robots), while disembodied AI operates in virtual environments (chatbots, software agents). Key differences include...",
  "sources": [
    {
      "id": "emb-ai-101",
      "title": "Chapter 2.1: What is Embodied AI?",
      "url": "/docs/module-2-embodied/fundamentals#what-is",
      "excerpt": "Embodied AI systems have sensors and actuators...",
      "score": 0.94
    }
  ],
  "metadata": {
    "model": "gpt-4",
    "tokens_used": 320,
    "retrieval_time_ms": 95,
    "generation_time_ms": 650,
    "total_time_ms": 745
  }
}
```

### Example 2: Chat Mode (Selected Text)

**Request**:
```http
POST /api/v1/chat HTTP/1.1
Content-Type: application/json

{
  "message": "Explain this in simpler terms",
  "context": {
    "mode": "chat",
    "selected_text": "The kinematic chain of a humanoid robot consists of multiple degrees of freedom (DOF), each representing independent motion capabilities.",
    "page_url": "/docs/module-3-humanoid/kinematics",
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "tier": "anonymous"
}
```

**Response**:
```json
{
  "answer": "Think of a humanoid robot's body as having many movable joints (shoulders, elbows, hips, etc.). Each joint can move independently - that's what 'degrees of freedom' means. More joints = more complex movements possible.",
  "sources": [
    {
      "id": "kin-chain-basics",
      "title": "Chapter 3.2: Kinematic Chains",
      "url": "/docs/module-3-humanoid/kinematics#chains",
      "excerpt": "A kinematic chain is a series of rigid links...",
      "score": 0.88
    }
  ],
  "metadata": {
    "model": "gpt-4",
    "tokens_used": 180,
    "retrieval_time_ms": 60,
    "generation_time_ms": 400,
    "total_time_ms": 460
  }
}
```

---

## Alignment with Frozen Design

**Design Reference**: commit [5b2a756](https://github.com/assadsharif/Hackathon_01/commit/5b2a756)

**Patterns Followed**:
- ✅ **Pattern 4: Citation Rendering with Stable IDs** - `sources[].id` field
- ✅ **Dual-Mode Retrieval** (US2) - `context.mode` field ("browse" vs "chat")
- ✅ **Progressive Signup** (US3) - `tier` field for anonymous → authenticated
- ✅ **Compliance Rules** - Rate limits, error codes, session tracking

**MCP Event Schemas**:
- Aligns with ChatKit MCP `chat_message_sent` event schema
- Compatible with Better-Auth MCP session tier detection

---

## Client-Side Validation (Widget Responsibility)

Before sending request, widget MUST validate:

1. **Message**: Non-empty, ≤2000 characters
2. **Session ID**: Valid UUID v4 (generate if missing)
3. **Selected Text**: ≤5000 characters (if mode=chat)
4. **Tier**: Current user tier from AuthClient

**Widget should NOT send** invalid requests to avoid 400 errors.

---

## Backend Responsibilities

1. **Validate** all incoming requests (schema, constraints)
2. **Rate limit** based on tier (anonymous: 10/min, lightweight: 30/min, etc.)
3. **Log** session_id + page_url for analytics (compliance-safe)
4. **Return** consistent error format (never expose stack traces)
5. **Timeout** requests after 30 seconds (return 503)

---

## Next Steps

1. **Backend Implementation**: Create FastAPI endpoint matching this contract
2. **Widget Integration**: Update `rag-client.ts` to call this endpoint
3. **Error Handling**: Map HTTP status codes to user-friendly messages
4. **Testing**: Smoke test with curl/Postman before widget integration

---

**Contract Version**: 1.0.0
**Last Updated**: 2025-12-27
**Status**: ✅ Ready for Implementation
