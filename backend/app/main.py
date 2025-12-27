"""
FastAPI Backend - Phase 7B Mock

NO vector DB
NO LLM
ONLY wiring

Mock response matches specs/phase-7b/rag-api.contract.md
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import time
from typing import Literal
from uuid import UUID

app = FastAPI(title="ChatKit RAG API", version="0.1.0")

# CORS for local development (widget → backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models (from contract)
class ChatContext(BaseModel):
    mode: Literal["browse", "chat"]
    selected_text: str | None = None
    page_url: str | None = None
    session_id: UUID

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    context: ChatContext
    tier: Literal["anonymous", "lightweight", "full", "premium"]

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()

# Response models (from contract)
class Source(BaseModel):
    id: str
    title: str
    url: str
    excerpt: str
    score: float

class ResponseMetadata(BaseModel):
    model: str
    tokens_used: int
    retrieval_time_ms: int
    generation_time_ms: int
    total_time_ms: int

class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
    metadata: ResponseMetadata

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Mock RAG endpoint

    Returns static response matching contract spec.
    NO vector DB, NO LLM - just wiring validation.
    """
    start_time = time.time()

    # Mock retrieval time
    retrieval_time_ms = 95

    # Mock generation time
    generation_time_ms = 650

    # Mock response (static)
    mock_response = ChatResponse(
        answer="Mock response from backend. Your question was: '{}'".format(request.message),
        sources=[
            Source(
                id="mock-source-1",
                title="Mock Chapter: Physical AI Introduction",
                url="/docs/mock-page",
                excerpt="This is a mock source excerpt for testing...",
                score=0.92
            )
        ],
        metadata=ResponseMetadata(
            model="mock-model",
            tokens_used=150,
            retrieval_time_ms=retrieval_time_ms,
            generation_time_ms=generation_time_ms,
            total_time_ms=int((time.time() - start_time) * 1000)
        )
    )

    return mock_response

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "version": "0.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
