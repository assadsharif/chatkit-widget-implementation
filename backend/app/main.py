"""
FastAPI Backend - Phase 11 (Integration & Hardening)

Clean orchestration layer with database persistence.
All business logic delegated to services.
Phase 11A: Integration test mode support.
"""

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Literal, Optional
from datetime import datetime, timedelta
import secrets
import re

# Configuration (Phase 11A)
from app import config

# Database and models
from app.database import engine, get_db, Base
from app.models import User, Session as DBSession, VerificationToken, SavedChat, AnonymousSession, AnalyticsEvent

# Services
from app.services import email_service, personalize_service, analytics_service

# Test fixtures (Phase 11A)
from app import test_fixtures

app = FastAPI(title="ChatKit API", version="0.3.0-dev")

# CORS (Phase 11C: CORS lockdown)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,  # Explicit allowlist (not *)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Startup/Shutdown =====

@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")

    # Phase 11A: Integration test mode diagnostics
    if config.INTEGRATION_TEST_MODE:
        print("🧪 INTEGRATION TEST MODE ENABLED")
        print(f"   Rate limit window: {config.RATE_LIMIT_WINDOW_SECONDS}s")
        print(f"   Email disabled: {not config.EMAIL_ENABLED}")
        print(f"   CORS origins: {config.CORS_ORIGINS}")

        # Clear analytics table for fresh test runs
        db = next(get_db())
        try:
            db.query(AnalyticsEvent).delete()
            db.commit()
            print("   ✅ Analytics table cleared for testing")
        except Exception as e:
            print(f"   ⚠️  Failed to clear analytics: {e}")
        finally:
            db.close()

        # Setup deterministic test fixtures
        test_fixtures.setup_integration_test_fixtures()
    else:
        diagnostics = config.get_integration_test_diagnostics()
        print(f"🚀 Production mode: {diagnostics}")

# ===== Pydantic Models (API Contracts) =====

class SignupRequest(BaseModel):
    email: str
    consent_data_storage: bool
    migrate_session: Optional[bool] = None

class SignupResponse(BaseModel):
    status: Literal["verification_sent"]

class VerifyRequest(BaseModel):
    token: str

class UserProfile(BaseModel):
    email: str
    tier: str

class VerifyResponse(BaseModel):
    session_token: str
    user_profile: UserProfile

class SaveChatRequest(BaseModel):
    messages: list[dict]
    title: Optional[str] = None

class SaveChatResponse(BaseModel):
    chat_id: str
    saved_at: str

class PersonalizeRequest(BaseModel):
    preferences: Optional[dict] = None

class PersonalizeResponse(BaseModel):
    recommendations: list[str]
    personalized_content: dict

class ResendVerificationRequest(BaseModel):
    email: str

class ResendVerificationResponse(BaseModel):
    status: Literal["verification_sent"]

class MigrateSessionRequest(BaseModel):
    anon_id: str

class MigrateSessionResponse(BaseModel):
    migrated_messages: int

class AnalyticsEventRequest(BaseModel):
    event_type: str
    event_data: Optional[dict] = None

class AnalyticsEventResponse(BaseModel):
    event_id: int
    logged_at: str

# ===== Helper Functions =====

def is_valid_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def validate_token(authorization: str | None, db: Session) -> DBSession:
    """Validate authorization header and return session"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Authorization header required"}}
        )

    token = authorization[7:]
    session = db.query(DBSession).filter(DBSession.session_token == token).first()

    if not session:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "SESSION_EXPIRED", "message": "Session has expired or is invalid"}}
        )

    return session

# ===== Auth Endpoints =====

@app.post("/api/v1/auth/signup", response_model=SignupResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """User signup with email verification"""

    # Validate email
    if not is_valid_email(request.email):
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_EMAIL", "message": "Please enter a valid email address"}}
        )

    # Validate consent
    if not request.consent_data_storage:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "CONSENT_REQUIRED", "message": "You must consent to data storage"}}
        )

    # Create or get user
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        user = User(email=request.email, email_verified=False, tier="lightweight")
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create verification token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    verification = VerificationToken(
        email=request.email,
        token=token,
        expires_at=expires_at,
        used=False
    )
    db.add(verification)
    db.commit()

    # Send email (via service)
    await email_service.send_verification_email(request.email, token)

    # Log analytics event
    await analytics_service.log_event(db, "signup", user_email=request.email)

    return SignupResponse(status="verification_sent")

@app.post("/api/v1/auth/verify", response_model=VerifyResponse)
async def verify(request: VerifyRequest, db: Session = Depends(get_db)):
    """Verify email with token"""

    # Find token
    verification = db.query(VerificationToken).filter(
        VerificationToken.token == request.token,
        VerificationToken.used == False
    ).first()

    if not verification:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_TOKEN", "message": "Invalid or expired verification token"}}
        )

    # Check expiration
    if datetime.utcnow() > verification.expires_at:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "TOKEN_EXPIRED", "message": "Verification token has expired"}}
        )

    # Mark token as used
    verification.used = True

    # Update user
    user = db.query(User).filter(User.email == verification.email).first()
    if user:
        user.email_verified = True

    # Create session
    session_token = secrets.token_urlsafe(32)
    session = DBSession(
        user_id=user.id,
        session_token=session_token,
        created_at=datetime.utcnow(),
        last_activity=datetime.utcnow()
    )
    db.add(session)
    db.commit()

    # Log analytics event
    await analytics_service.log_event(db, "email_verified", user_email=user.email)

    return VerifyResponse(
        session_token=session_token,
        user_profile=UserProfile(email=user.email, tier=user.tier)
    )

@app.get("/api/v1/auth/session-check")
async def session_check(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Check session validity"""
    session = validate_token(authorization, db)
    user = db.query(User).filter(User.id == session.user_id).first()

    # Update last activity
    session.last_activity = datetime.utcnow()
    db.commit()

    return {
        "valid": True,
        "user": UserProfile(email=user.email, tier=user.tier)
    }

@app.get("/api/v1/auth/verification-status")
async def verification_status(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Check email verification status"""
    session = validate_token(authorization, db)
    user = db.query(User).filter(User.id == session.user_id).first()

    return {"verified": user.email_verified}

@app.post("/api/v1/auth/refresh-token")
async def refresh_token(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Refresh session token"""
    old_session = validate_token(authorization, db)

    # Create new token
    new_token = secrets.token_urlsafe(32)
    new_session = DBSession(
        user_id=old_session.user_id,
        session_token=new_token,
        created_at=datetime.utcnow(),
        last_activity=datetime.utcnow()
    )
    db.add(new_session)
    db.commit()

    return {"token": new_token}

@app.post("/api/v1/auth/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(request: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Resend verification email"""

    if not is_valid_email(request.email):
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_EMAIL", "message": "Please enter a valid email address"}}
        )

    # Create new token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    verification = VerificationToken(
        email=request.email,
        token=token,
        expires_at=expires_at,
        used=False
    )
    db.add(verification)
    db.commit()

    # Send email
    await email_service.send_verification_email(request.email, token)

    return ResendVerificationResponse(status="verification_sent")

@app.post("/api/v1/auth/migrate-session", response_model=MigrateSessionResponse)
async def migrate_session(request: MigrateSessionRequest, authorization: str = Header(None), db: Session = Depends(get_db)):
    """Migrate anonymous session to authenticated user"""
    session = validate_token(authorization, db)
    user = db.query(User).filter(User.id == session.user_id).first()

    # Find anonymous session
    anon_session = db.query(AnonymousSession).filter(AnonymousSession.anon_id == request.anon_id).first()

    if not anon_session:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "SESSION_NOT_FOUND", "message": "Anonymous session not found"}}
        )

    messages = anon_session.messages

    # Create saved chat
    if messages:
        saved_chat = SavedChat(
            user_id=user.id,
            title="Migrated Chat (Anonymous Session)",
            messages=messages,
            created_at=datetime.utcnow()
        )
        db.add(saved_chat)

    # Delete anonymous session
    db.delete(anon_session)
    db.commit()

    # Log analytics event
    await analytics_service.log_event(db, "anonymous_to_authenticated", user_email=user.email, event_data={"migrated_messages": len(messages)})

    return MigrateSessionResponse(migrated_messages=len(messages))

# ===== Chat Endpoints =====

@app.post("/api/v1/chat/save", response_model=SaveChatResponse)
async def save_chat(request: SaveChatRequest, authorization: str = Header(None), db: Session = Depends(get_db)):
    """Save chat for authenticated user"""
    session = validate_token(authorization, db)
    user = db.query(User).filter(User.id == session.user_id).first()

    # Create saved chat
    saved_chat = SavedChat(
        user_id=user.id,
        title=request.title or f"Chat {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        messages=request.messages,
        created_at=datetime.utcnow()
    )
    db.add(saved_chat)
    db.commit()
    db.refresh(saved_chat)

    # Log analytics event
    await analytics_service.log_event(db, "save_chat", user_email=user.email, event_data={"chat_id": saved_chat.id})

    return SaveChatResponse(
        chat_id=str(saved_chat.id),
        saved_at=saved_chat.created_at.isoformat()
    )

# ===== User Endpoints =====

@app.post("/api/v1/user/personalize", response_model=PersonalizeResponse)
async def personalize(request: PersonalizeRequest, authorization: str = Header(None), db: Session = Depends(get_db)):
    """Generate personalized recommendations"""
    session = validate_token(authorization, db)
    user = db.query(User).filter(User.id == session.user_id).first()

    # Get user's saved chats for context
    saved_chats = db.query(SavedChat).filter(SavedChat.user_id == user.id).all()
    chat_history = []
    for chat in saved_chats:
        chat_history.extend(chat.messages)

    # Get recommendations from service
    result = await personalize_service.get_recommendations(
        user_email=user.email,
        user_tier=user.tier,
        preferences=request.preferences,
        chat_history=chat_history
    )

    # Log analytics event
    await analytics_service.log_event(db, "personalize", user_email=user.email)

    return PersonalizeResponse(
        recommendations=result["recommendations"],
        personalized_content=result["personalized_content"]
    )

# ===== Analytics Endpoints =====

@app.post("/api/v1/analytics/event", response_model=AnalyticsEventResponse)
async def log_analytics_event(
    request: AnalyticsEventRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Log analytics event (authenticated or anonymous)"""

    user_email = None
    if authorization:
        try:
            session = validate_token(authorization, db)
            user = db.query(User).filter(User.id == session.user_id).first()
            user_email = user.email
        except:
            pass  # Allow anonymous events

    # Log event
    event = await analytics_service.log_event(
        db,
        event_type=request.event_type,
        user_email=user_email,
        event_data=request.event_data
    )

    return AnalyticsEventResponse(
        event_id=event.id,
        logged_at=event.created_at.isoformat()
    )

# ===== Health Endpoint =====

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "ok", "version": "0.2.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
