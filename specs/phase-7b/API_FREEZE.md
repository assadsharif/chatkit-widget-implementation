# Phase 7B API Freeze

**Date**: 2025-12-27
**Status**: 🔒 FROZEN

---

## Purpose

This document freezes all public APIs after Phase 7B verification. Any breaking changes after this point require major version bump and migration guide.

---

## Frozen APIs

### 1. Widget Public API

**Custom Element**: `<chatkit-widget>`

**Attributes**: None (all configuration internal for Phase 7B)

**Events Dispatched**:
- `chatkit:send` - Fired when user sends message
  ```typescript
  interface ChatKitSendEvent extends CustomEvent {
    detail: {
      message: string;
      timestamp: number;
    }
  }
  ```

**Frozen**: ✅
**Breaking Changes Allowed**: ❌ NO (until Phase 8+)

---

### 2. RAG Client Interface

**Class**: `RAGClient`

**Constructor**:
```typescript
constructor(baseURL?: string, timeout?: number)
```
- `baseURL`: Default `http://localhost:8000`
- `timeout`: Default `30000` (30 seconds)

**Public Methods**:
```typescript
async sendMessage(request: RAGRequest): Promise<RAGResponse>
cancel(): void
```

**Frozen**: ✅
**Breaking Changes Allowed**: ❌ NO

---

### 3. Request Contract

**Interface**: `RAGRequest`

```typescript
interface RAGRequest {
  message: string;              // 1-2000 chars
  context: RAGContext;
  tier: 'anonymous' | 'lightweight' | 'full' | 'premium';
}

interface RAGContext {
  mode: 'browse' | 'chat';
  selected_text?: string;       // 0-5000 chars
  page_url?: string;
  session_id: string;           // UUID v4
}
```

**Validation Rules**:
- `message`: Trimmed, 1-2000 chars
- `context.selected_text`: Optional, max 5000 chars
- `context.session_id`: Valid UUID v4 format
- No extra fields allowed

**Frozen**: ✅
**Breaking Changes Allowed**: ❌ NO

---

### 4. Response Contract

**Interface**: `RAGResponse`

```typescript
interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  metadata: RAGMetadata;
}

interface RAGSource {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  score: number;
}

interface RAGMetadata {
  model: string;
  tokens_used: number;
  retrieval_time_ms: number;
  generation_time_ms: number;
  total_time_ms: number;
}
```

**Frozen**: ✅
**Breaking Changes Allowed**: ❌ NO

**Additions Allowed**: ✅ YES (non-breaking)
- New optional fields OK
- New required fields NOT OK

---

### 5. Error Contract

**Interface**: `RAGClientError`

```typescript
class RAGClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  )
}
```

**Error Codes** (Frozen):
- `INVALID_REQUEST` (422)
- `MESSAGE_TOO_LONG` (422)
- `INVALID_SESSION_ID` (422)
- `RATE_LIMIT_EXCEEDED` (429)
- `REQUEST_TIMEOUT` (client-side timeout)
- `NETWORK_ERROR` (connection failed)
- `REQUEST_CANCELLED` (manual cancel)
- `UNKNOWN_ERROR` (fallback)

**Frozen**: ✅
**New Error Codes Allowed**: ✅ YES (non-breaking)
**Removing Error Codes Allowed**: ❌ NO

---

### 6. Backend API Endpoint

**Endpoint**: `POST /api/v1/chat`

**Version**: `v1` (frozen)

**Request Body**: See `RAGRequest` above

**Response Body**: See `RAGResponse` above

**HTTP Status Codes**:
- `200`: Success
- `400`: Invalid request (malformed JSON)
- `422`: Validation error (contract violation)
- `429`: Rate limit exceeded
- `500`: Internal server error
- `503`: Service unavailable

**Frozen**: ✅
**Breaking Changes Allowed**: ❌ NO

**Future Versions**: ✅ YES
- `/api/v2/chat` allowed with new contract
- `/api/v1/chat` must remain stable

---

### 7. CORS Headers

**Headers** (Required):
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Frozen**: ✅
**Changes Allowed**: ⚠️ Only if backwards-compatible

---

### 8. Timeout Behavior

**Client-Side Timeout**: 30 seconds (configurable)

**Behavior**:
1. Request aborted after timeout
2. `REQUEST_TIMEOUT` error thrown
3. User message: "I'm offline right now, I'll reconnect shortly."

**Frozen**: ✅
**Changes Allowed**: ⚠️ Only if backwards-compatible

---

## What is NOT Frozen

These can change in future phases:

- **Internal Implementation**: Widget rendering logic, styles, etc.
- **Backend Logic**: Vector DB, LLM provider, retrieval algorithm
- **UI/UX**: Loading states, animations, message styling
- **Performance**: Response times, caching, optimization
- **New Features**: Source rendering, OAuth, streaming (Phase 7C+)

**Additions**: New optional fields, new error codes, new endpoints

---

## Version Compatibility

**Current Version**: Phase 7B (v0.1.0)

**Compatibility Promise**:
- Widget v0.1.x ↔ Backend v0.1.x: ✅ Guaranteed compatible
- Widget v0.2.x ↔ Backend v0.1.x: ⚠️ Backwards-compatible only
- Widget v1.x ↔ Backend v1.x: ✅ Guaranteed compatible
- Cross-major versions: ❌ Not guaranteed

---

## Change Management

**Adding Fields** (Non-Breaking):
```typescript
// ✅ OK: New optional field
interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  metadata: RAGMetadata;
  citations?: string[];  // NEW: Optional
}
```

**Removing Fields** (BREAKING):
```typescript
// ❌ NOT OK: Breaking change
interface RAGResponse {
  answer: string;
  // sources: RAGSource[];  // REMOVED: Breaking!
  metadata: RAGMetadata;
}
```

**Renaming Fields** (BREAKING):
```typescript
// ❌ NOT OK: Breaking change
interface RAGResponse {
  response: string;  // RENAMED from 'answer': Breaking!
  sources: RAGSource[];
  metadata: RAGMetadata;
}
```

---

## Migration Path (Future)

If breaking changes are required:

1. Create new version endpoint (`/api/v2/chat`)
2. Maintain `/api/v1/chat` for 6+ months
3. Provide migration guide
4. Deprecation warnings in widget
5. Document breaking changes in CHANGELOG.md

---

## Enforcement

**Code Review**: All PR modifying frozen APIs require approval
**Tests**: Integration tests validate contract compliance
**Versioning**: Semantic versioning enforced (MAJOR.MINOR.PATCH)

---

## Exceptions

Breaking changes allowed ONLY for:
- **Critical Security Vulnerabilities**
- **Data Loss Prevention**
- **Legal/Compliance Requirements**

All exceptions require:
1. Documented justification
2. Migration guide
3. Deprecation period (if feasible)

---

**Last Updated**: 2025-12-27
**Approved By**: Claude Sonnet 4.5
**Next Review**: Phase 8 (Post-Authentication)
