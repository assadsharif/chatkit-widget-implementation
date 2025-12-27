# RAG Streaming Contract (Optional)

**Phase**: 7B - RAG Connectivity (Streaming Support)
**Purpose**: Define Server-Sent Events (SSE) protocol for real-time response streaming
**Design Reference**: [RAG Chatbot Patterns](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/.claude/skills/rag-chatbot/patterns.md)

---

## Endpoint

```
POST /api/v1/chat/stream
```

**Protocol**: Server-Sent Events (SSE)

---

## Request Shape

### Headers

```http
Content-Type: application/json
Accept: text/event-stream
Authorization: Bearer <optional-session-token>
```

### Body

**Same as non-streaming endpoint** (see `rag-api.contract.md`):

```json
{
  "message": "What is embodied AI?",
  "context": {
    "mode": "browse" | "chat",
    "selected_text": "optional",
    "page_url": "optional",
    "session_id": "UUID"
  },
  "tier": "anonymous" | "lightweight" | "full" | "premium"
}
```

---

## Response Shape (Server-Sent Events)

### Status Code

```
200 OK
```

### Headers

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Event Stream Format

**Event Types**:
1. `sources` - Retrieved documents (sent first)
2. `token` - Individual response tokens (streamed)
3. `done` - Final metadata (sent last)
4. `error` - Error occurred (terminates stream)

---

## Event: `sources`

Sent **first**, before token streaming begins.

```
event: sources
data: {"sources":[{"id":"stable-id-123","title":"Chapter 2","url":"/docs/module-2","excerpt":"...","score":0.92}]}

```

**Data Payload**:
```json
{
  "sources": [
    {
      "id": "string",
      "title": "string",
      "url": "string",
      "excerpt": "string",
      "score": float
    }
  ]
}
```

**Notes**:
- Sent only once at stream start
- Widget can render citation tooltips before answer appears
- Max 5 sources

---

## Event: `token`

Sent **multiple times**, one per token chunk.

```
event: token
data: {"content":"Embodied"}

event: token
data: {"content":" AI"}

event: token
data: {"content":" refers"}

```

**Data Payload**:
```json
{
  "content": "string"
}
```

**Notes**:
- Each event contains a single token/word/phrase
- Widget appends to message bubble progressively
- Typical rate: 10-50 tokens/second (depends on LLM)

---

## Event: `done`

Sent **last**, after all tokens streamed.

```
event: done
data: {"metadata":{"model":"gpt-4","tokens_used":450,"retrieval_time_ms":120,"generation_time_ms":800,"total_time_ms":920}}

```

**Data Payload**:
```json
{
  "metadata": {
    "model": "string",
    "tokens_used": int,
    "retrieval_time_ms": int,
    "generation_time_ms": int,
    "total_time_ms": int
  }
}
```

**Notes**:
- Signals end of stream
- Widget stops listening for events
- Metadata logged for analytics

---

## Event: `error`

Sent **if error occurs**, terminates stream immediately.

```
event: error
data: {"error":{"code":"RATE_LIMIT_EXCEEDED","message":"Too many requests","details":{"retry_after":60}}}

```

**Data Payload**:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": object | null
  }
}
```

**Error Codes** (same as non-streaming):
- `INVALID_REQUEST`
- `MESSAGE_TOO_LONG`
- `UNAUTHORIZED`
- `RATE_LIMIT_EXCEEDED`
- `INTERNAL_ERROR`
- `SERVICE_UNAVAILABLE`

**Notes**:
- Widget displays error message
- Stream connection closes
- No retry logic (widget responsibility)

---

## Example Stream

**Request**:
```http
POST /api/v1/chat/stream HTTP/1.1
Content-Type: application/json
Accept: text/event-stream

{
  "message": "What is embodied AI?",
  "context": {
    "mode": "browse",
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "tier": "anonymous"
}
```

**Response Stream**:
```
event: sources
data: {"sources":[{"id":"emb-ai-101","title":"Chapter 2.1","url":"/docs/module-2-embodied/fundamentals","excerpt":"Embodied AI systems...","score":0.94}]}

event: token
data: {"content":"Embodied"}

event: token
data: {"content":" AI"}

event: token
data: {"content":" refers"}

event: token
data: {"content":" to"}

event: token
data: {"content":" artificial"}

event: token
data: {"content":" intelligence"}

event: token
data: {"content":" systems"}

event: token
data: {"content":" that"}

event: token
data: {"content":" have"}

event: token
data: {"content":" a"}

event: token
data: {"content":" physical"}

event: token
data: {"content":" presence"}

event: token
data: {"content":"..."}

event: done
data: {"metadata":{"model":"gpt-4","tokens_used":320,"retrieval_time_ms":95,"generation_time_ms":650,"total_time_ms":745}}

```

---

## Client-Side Implementation (Widget)

### EventSource API

```typescript
const eventSource = new EventSource('/api/v1/chat/stream', {
  withCredentials: true // Include cookies for auth
});

eventSource.addEventListener('sources', (event) => {
  const data = JSON.parse(event.data);
  renderSources(data.sources);
});

eventSource.addEventListener('token', (event) => {
  const data = JSON.parse(event.data);
  appendTokenToMessage(data.content);
});

eventSource.addEventListener('done', (event) => {
  const data = JSON.parse(event.data);
  logMetadata(data.metadata);
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  displayError(data.error.message);
  eventSource.close();
});
```

**Notes**:
- EventSource API is native browser support
- No polyfills needed (supported in all modern browsers)
- Widget must handle connection errors (network timeout, server disconnect)

---

## Backend Responsibilities

1. **Keep connection alive**: Send comment lines (`: ping\n\n`) every 15 seconds if no data
2. **Flush buffers**: Ensure each event is sent immediately (not buffered)
3. **Close on error**: Terminate stream gracefully on error (send `error` event first)
4. **Timeout**: Auto-close stream after 60 seconds if no events sent
5. **Rate limit**: Same limits as non-streaming endpoint

---

## When to Use Streaming vs Non-Streaming

### Use Streaming (/api/v1/chat/stream) When:
- ✅ User wants real-time feedback (long answers)
- ✅ Response time > 3 seconds expected
- ✅ UX benefit from progressive rendering
- ✅ Tier 1+ users (better network reliability)

### Use Non-Streaming (/api/v1/chat) When:
- ✅ Short answers (< 100 tokens)
- ✅ Network unreliable (mobile, slow connections)
- ✅ Tier 0 (anonymous) users (simpler UX)
- ✅ Testing/debugging (easier to inspect JSON)

**Default**: Start with non-streaming in Phase 7B, add streaming later.

---

## Browser Compatibility

**EventSource API Support**:
- ✅ Chrome 6+
- ✅ Firefox 6+
- ✅ Safari 5+
- ✅ Edge 79+
- ❌ IE 11 (not supported, use non-streaming fallback)

**Polyfill** (if IE 11 support needed):
```javascript
import { EventSourcePolyfill } from 'event-source-polyfill';
const eventSource = new EventSourcePolyfill('/api/v1/chat/stream');
```

---

## Error Handling

### Network Timeout

```typescript
const eventSource = new EventSource('/api/v1/chat/stream');

// Set manual timeout (browser default: 45 seconds)
const timeoutId = setTimeout(() => {
  eventSource.close();
  displayError('Request timed out. Please try again.');
}, 30000); // 30 seconds

eventSource.addEventListener('done', () => {
  clearTimeout(timeoutId);
  eventSource.close();
});
```

### Connection Lost

```typescript
eventSource.onerror = (err) => {
  console.error('Stream error:', err);
  eventSource.close();
  displayError('Connection lost. Please refresh and try again.');
};
```

---

## Performance Considerations

**Token Chunk Size**:
- Too small (1 char): Network overhead, choppy animation
- Too large (100 chars): Defeats purpose of streaming
- **Recommended**: 5-15 characters per token

**Flush Frequency**:
- Backend must flush after each `token` event
- Use `response.flush()` or equivalent in FastAPI/Flask

**Buffer Size**:
- Disable server-side buffering (nginx, gunicorn, etc.)
- Set `X-Accel-Buffering: no` header if behind nginx

---

## Alignment with Frozen Design

**Design Reference**: commit [5b2a756](https://github.com/assadsharif/Hackathon_01/commit/5b2a756)

**Patterns Followed**:
- ✅ **Pattern 1: Event-Driven Architecture** - SSE is event-based
- ✅ **Pattern 2: Progressive Loading** - Tokens stream progressively
- ✅ **Pattern 4: Citation Rendering** - Sources sent first (before answer)
- ✅ **Pattern 5: Graceful Degradation** - Fallback to non-streaming on error

---

## Implementation Priority

**Phase 7B (Immediate)**:
- ✅ Implement non-streaming endpoint first (`/api/v1/chat`)
- ✅ Validate contract with smoke tests
- ✅ Widget integration with non-streaming

**Phase 7B+ (Later)**:
- ⏸️ Implement streaming endpoint (`/api/v1/chat/stream`)
- ⏸️ Widget EventSource integration
- ⏸️ Progressive rendering UX

**Reason**: Non-streaming is simpler, easier to debug, sufficient for MVP.

---

**Contract Version**: 1.0.0 (Optional)
**Last Updated**: 2025-12-27
**Status**: ⏸️ Deferred (Non-Streaming First)
