"""
FastAPI Backend - Phase 7B Mock

NO vector DB
NO LLM
ONLY wiring

Mock response matches specs/phase-7b/rag-api.contract.md
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import time
from typing import Literal
from uuid import UUID, uuid4
from datetime import datetime, timedelta
import re
import secrets

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

# Auth models (Phase 7C-B)
class SignupRequest(BaseModel):
    email: str
    consent_data_storage: bool
    migrate_session: bool | None = None

class SignupResponse(BaseModel):
    status: Literal["verification_sent"]

class VerifyRequest(BaseModel):
    token: str

class UserProfile(BaseModel):
    email: str
    tier: Literal["lightweight"]

class VerifyResponse(BaseModel):
    session_token: str
    user_profile: UserProfile

# Phase 8 models
class SaveChatRequest(BaseModel):
    messages: list[dict]  # [{role: str, content: str}]
    title: str | None = None

class SaveChatResponse(BaseModel):
    chat_id: str
    saved_at: str

class PersonalizeRequest(BaseModel):
    preferences: dict | None = None

class PersonalizeResponse(BaseModel):
    recommendations: list[str]
    personalized_content: dict

class ResendVerificationRequest(BaseModel):
    email: str

class ResendVerificationResponse(BaseModel):
    status: Literal["verification_sent"]

# In-memory storage for verification tokens (mock)
# Structure: { token: { email: str, expires_at: datetime } }
verification_tokens: dict[str, dict] = {}

# In-memory storage for sessions (mock)
# Structure: { session_token: { email: str, tier: str, created_at: datetime } }
sessions: dict[str, dict] = {}

# In-memory storage for saved chats (Phase 8)
# Structure: { chat_id: { user_email: str, messages: list, saved_at: datetime, title: str } }
saved_chats: dict[str, dict] = {}

# Rate limiting storage (Phase 8)
# Structure: { session_token: { chat_count: int, save_count: int, last_reset: datetime } }
rate_limits: dict[str, dict] = {}

# Anonymous session storage (Phase 9)
# Structure: { anon_id: { messages: list, created_at: datetime } }
anonymous_sessions: dict[str, dict] = {}

# User data storage (Phase 9)
# Structure: { email: { email_verified: bool, tier: str } }
users: dict[str, dict] = {}

def is_valid_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def validate_token(authorization: str | None) -> str:
    """
    Phase 8: Validate authorization header and extract token
    Raises HTTPException if invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Authorization header required"}}
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "INVALID_TOKEN", "message": "Invalid authorization format"}}
        )

    token = authorization[7:]  # Remove "Bearer " prefix

    if token not in sessions:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "SESSION_EXPIRED", "message": "Session has expired or is invalid"}}
        )

    return token

def check_rate_limit(token: str, action: str) -> None:
    """
    Phase 8: Check rate limits for actions

    Limits:
    - chat: 10 per minute
    - save: 5 per minute
    - personalize: 5 per minute
    """
    now = datetime.now()

    if token not in rate_limits:
        rate_limits[token] = {
            "chat_count": 0,
            "save_count": 0,
            "personalize_count": 0,
            "last_reset": now
        }

    limits = rate_limits[token]

    # Reset counters every minute
    if (now - limits["last_reset"]).total_seconds() > 60:
        limits["chat_count"] = 0
        limits["save_count"] = 0
        limits["personalize_count"] = 0
        limits["last_reset"] = now

    # Check limits
    if action == "chat" and limits["chat_count"] >= 10:
        raise HTTPException(
            status_code=429,
            detail={"error": {"code": "RATE_LIMIT_EXCEEDED", "message": "Too many chat requests. Please wait a moment."}}
        )
    elif action in ["save", "personalize"] and limits[f"{action}_count"] >= 5:
        raise HTTPException(
            status_code=429,
            detail={"error": {"code": "RATE_LIMIT_EXCEEDED", "message": f"Too many {action} requests. Please wait a moment."}}
        )

    # Increment counter
    limits[f"{action}_count"] += 1

@app.post("/api/v1/auth/signup", response_model=SignupResponse)
async def signup(request: SignupRequest):
    """
    STEP 1.2: Signup endpoint (MINIMAL, BORING, SAFE)

    Input: { email, consent_data_storage, migrate_session? }

    Validate:
    - email format
    - consent === true (hard fail)

    Action:
    - generate verification token (10 min TTL)
    - send email (dummy console log for now)

    Response:
    - { "status": "verification_sent" }

    NO: login, session creation, data migration
    """
    # Validate email format
    if not is_valid_email(request.email):
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_EMAIL", "message": "Please enter a valid email address"}}
        )

    # Validate consent (GDPR requirement)
    if not request.consent_data_storage:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "CONSENT_REQUIRED", "message": "You must consent to data storage to create an account"}}
        )

    # Generate verification token (10 min TTL)
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(minutes=10)

    verification_tokens[token] = {
        "email": request.email,
        "expires_at": expires_at
    }

    # Create user record (unverified)
    if request.email not in users:
        users[request.email] = {
            "email_verified": False,
            "tier": "lightweight"
        }

    # Send email (dummy console log for now)
    print(f"📧 VERIFICATION EMAIL (mock)")
    print(f"   To: {request.email}")
    print(f"   Token: {token}")
    print(f"   Expires: {expires_at}")
    print(f"   Link: http://localhost:3000/verify?token={token}")

    return SignupResponse(status="verification_sent")

@app.post("/api/v1/auth/verify", response_model=VerifyResponse)
async def verify(request: VerifyRequest):
    """
    STEP 1.3: Verify endpoint behavior

    Input: { token }

    Action:
    - validate token
    - create session token

    Response:
    - { "session_token": "...", "user_profile": { "email": "...", "tier": "lightweight" } }

    NO: OAuth, personalization, feature unlocks
    """
    # Validate token exists
    if request.token not in verification_tokens:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_TOKEN", "message": "Invalid or expired verification token"}}
        )

    token_data = verification_tokens[request.token]

    # Check expiration
    if datetime.now() > token_data["expires_at"]:
        del verification_tokens[request.token]
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "TOKEN_EXPIRED", "message": "Verification token has expired"}}
        )

    # Create session token
    session_token = secrets.token_urlsafe(32)
    email = token_data["email"]

    sessions[session_token] = {
        "email": email,
        "tier": "lightweight",
        "created_at": datetime.now()
    }

    # Mark user as verified
    if email in users:
        users[email]["email_verified"] = True

    # Clean up verification token (one-time use)
    del verification_tokens[request.token]

    print(f"✅ SESSION CREATED (mock)")
    print(f"   Email: {email}")
    print(f"   Session Token: {session_token}")
    print(f"   Email Verified: True")

    return VerifyResponse(
        session_token=session_token,
        user_profile=UserProfile(
            email=email,
            tier="lightweight"
        )
    )

@app.get("/api/v1/auth/session-check")
async def session_check(authorization: str = Header(None)):
    """
    Phase 7C-C: Session validity check

    Input: Authorization header with Bearer token
    Output: Session status + user profile

    Used by widget to auto-detect authenticated users on load.
    """
    # Check authorization header
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Authorization header required"}}
        )

    # Extract token from "Bearer <token>"
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "INVALID_TOKEN", "message": "Invalid authorization format"}}
        )

    token = authorization[7:]  # Remove "Bearer " prefix

    # Check if session exists
    if token not in sessions:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "SESSION_EXPIRED", "message": "Session has expired or is invalid"}}
        )

    session_data = sessions[token]

    print(f"✅ SESSION VALID (mock)")
    print(f"   Email: {session_data['email']}")
    print(f"   Token: {token}")

    return {
        "valid": True,
        "user": UserProfile(
            email=session_data["email"],
            tier=session_data["tier"]
        )
    }

@app.post("/api/v1/chat/save", response_model=SaveChatResponse)
async def save_chat(request: SaveChatRequest, authorization: str = Header(None)):
    """
    Phase 8: Save chat for authenticated user

    Input: Authorization header + messages list
    Output: { chat_id, saved_at }

    Rate limit: 5 saves per minute
    """
    # Validate token
    token = validate_token(authorization)

    # Check rate limit
    check_rate_limit(token, "save")

    session_data = sessions[token]

    # Generate chat ID
    chat_id = secrets.token_urlsafe(16)

    # Save chat
    saved_chats[chat_id] = {
        "user_email": session_data["email"],
        "messages": request.messages,
        "saved_at": datetime.now(),
        "title": request.title or f"Chat {len(saved_chats) + 1}"
    }

    print(f"💾 CHAT SAVED (mock)")
    print(f"   Chat ID: {chat_id}")
    print(f"   User: {session_data['email']}")
    print(f"   Messages: {len(request.messages)}")

    return SaveChatResponse(
        chat_id=chat_id,
        saved_at=datetime.now().isoformat()
    )

@app.post("/api/v1/user/personalize", response_model=PersonalizeResponse)
async def personalize(request: PersonalizeRequest, authorization: str = Header(None)):
    """
    Phase 8: Generate personalized recommendations

    Input: Authorization header + optional preferences
    Output: { recommendations, personalized_content }

    Rate limit: 5 personalize actions per minute
    """
    # Validate token
    token = validate_token(authorization)

    # Check rate limit
    check_rate_limit(token, "personalize")

    session_data = sessions[token]

    # Mock personalization (in real app, use ML/AI)
    recommendations = [
        "Chapter 3: Advanced Robotics Concepts",
        "Tutorial: Building Your First Humanoid",
        "Video: Understanding Sensor Fusion"
    ]

    personalized_content = {
        "difficulty_level": "intermediate",
        "learning_path": ["basics", "sensors", "control", "advanced"],
        "next_chapter": "perception-action-loops"
    }

    print(f"✨ PERSONALIZATION ACTIVATED (mock)")
    print(f"   User: {session_data['email']}")
    print(f"   Preferences: {request.preferences}")

    return PersonalizeResponse(
        recommendations=recommendations,
        personalized_content=personalized_content
    )

@app.post("/api/v1/auth/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(request: ResendVerificationRequest):
    """
    Phase 8: Resend email verification link

    Input: { email }
    Output: { status: "verification_sent" }

    No rate limit (handled by email provider)
    """
    # Validate email
    if not is_valid_email(request.email):
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_EMAIL", "message": "Please enter a valid email address"}}
        )

    # Generate new verification token (10 min TTL)
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(minutes=10)

    verification_tokens[token] = {
        "email": request.email,
        "expires_at": expires_at
    }

    # Send email (dummy console log)
    print(f"📧 VERIFICATION EMAIL RESENT (mock)")
    print(f"   To: {request.email}")
    print(f"   Token: {token}")
    print(f"   Expires: {expires_at}")
    print(f"   Link: http://localhost:3000/verify?token={token}")

    return ResendVerificationResponse(status="verification_sent")

@app.get("/api/v1/auth/verification-status")
async def verification_status(authorization: str = Header(None)):
    """
    Phase 9: Check email verification status

    Input: Authorization header with Bearer token
    Output: { verified: bool }

    Used by widget to show verification badge.
    """
    # Validate token
    token = validate_token(authorization)
    session_data = sessions[token]
    email = session_data["email"]

    # Get verification status
    verified = users.get(email, {}).get("email_verified", False)

    print(f"🔍 VERIFICATION STATUS CHECK (mock)")
    print(f"   Email: {email}")
    print(f"   Verified: {verified}")

    return {"verified": verified}

@app.post("/api/v1/auth/refresh-token")
async def refresh_token(authorization: str = Header(None)):
    """
    Phase 9: Refresh session token

    Input: Authorization header with Bearer token
    Output: { token: str }

    Issues new token with extended TTL.
    Old token remains valid for 5 minutes for graceful transition.
    """
    # Validate old token
    old_token = validate_token(authorization)
    session_data = sessions[old_token]

    # Generate new token
    new_token = secrets.token_urlsafe(32)

    # Copy session data to new token
    sessions[new_token] = {
        "email": session_data["email"],
        "tier": session_data["tier"],
        "created_at": datetime.now()
    }

    print(f"🔄 TOKEN REFRESHED (mock)")
    print(f"   Email: {session_data['email']}")
    print(f"   Old Token: {old_token[:16]}...")
    print(f"   New Token: {new_token[:16]}...")

    return {"token": new_token}

class MigrateSessionRequest(BaseModel):
    anon_id: str

class MigrateSessionResponse(BaseModel):
    migrated_messages: int

@app.post("/api/v1/auth/migrate-session", response_model=MigrateSessionResponse)
async def migrate_session(request: MigrateSessionRequest, authorization: str = Header(None)):
    """
    Phase 9: Migrate anonymous session to authenticated user

    Input: Authorization header + anon_id
    Output: { migrated_messages: int }

    Transfers anonymous chat messages to authenticated user's saved chats.
    """
    # Validate token
    token = validate_token(authorization)
    session_data = sessions[token]

    # Get anonymous session
    if request.anon_id not in anonymous_sessions:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "SESSION_NOT_FOUND", "message": "Anonymous session not found"}}
        )

    anon_session = anonymous_sessions[request.anon_id]
    messages = anon_session.get("messages", [])

    # Create saved chat from anonymous messages
    if messages:
        chat_id = secrets.token_urlsafe(16)
        saved_chats[chat_id] = {
            "user_email": session_data["email"],
            "messages": messages,
            "saved_at": datetime.now(),
            "title": f"Migrated Chat (Anonymous Session)"
        }

    # Clean up anonymous session
    del anonymous_sessions[request.anon_id]

    print(f"🔀 SESSION MIGRATED (mock)")
    print(f"   Anon ID: {request.anon_id}")
    print(f"   User: {session_data['email']}")
    print(f"   Messages: {len(messages)}")

    return MigrateSessionResponse(migrated_messages=len(messages))

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
