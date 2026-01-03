"""
FastAPI Backend - Phase 11 (Integration & Hardening) + Phase 13 (Observability)

Clean orchestration layer with database persistence.
All business logic delegated to services.
Phase 11A: Integration test mode support.
Phase 13C: Global exception handler for error boundaries.
"""

# Load environment variables FIRST
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Header, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Literal, Optional
from datetime import datetime, timedelta
import secrets
import re
import os

# Configuration (Phase 11A)
from app import config

# Database and models
from app.database import engine, get_db, Base
from app.models import User, Session as DBSession, VerificationToken, SavedChat, AnonymousSession, AnalyticsEvent

# Services
from app.services import email_service, personalize_service, analytics_service

# Test fixtures (Phase 11A)
from app import test_fixtures

# Rate limiter (Phase 11B)
from app import rate_limiter

# Middleware (Phase 13A)
from app.middleware import RequestIDMiddleware

# Logger (Phase 13B)
from app.logger import log

app = FastAPI(title="ChatKit API", version="0.4.0-dev")

# Phase 13A: Request ID Middleware (must be first for tracing)
app.add_middleware(RequestIDMiddleware)

# CORS (Phase 11C: CORS lockdown)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,  # Explicit allowlist (not *)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phase 11C: Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)

    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"

    # Prevent clickjacking attacks
    response.headers["X-Frame-Options"] = "DENY"

    # Control referrer information
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Content Security Policy (basic, can be enhanced)
    response.headers["Content-Security-Policy"] = "default-src 'self'"

    # XSS Protection (legacy, but still useful for older browsers)
    response.headers["X-XSS-Protection"] = "1; mode=block"

    return response

# Phase 13C: Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for all unhandled exceptions.

    Phase 13C: Error Boundaries & Failure Surfaces

    Ensures all exceptions return:
    1. Structured error response with request_id
    2. Appropriate HTTP status code
    3. Logged error with full context
    4. User-safe error message (no stack traces in production)
    """
    # Get request ID from request state (set by RequestIDMiddleware)
    request_id = getattr(request.state, "request_id", "unknown")

    # Log error with structured logging
    log.error(
        "unhandled_exception",
        exception_type=type(exc).__name__,
        exception_message=str(exc),
        request_id=request_id,
        request_method=request.method,
        request_url=str(request.url),
    )

    # Return structured error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred. Please try again later.",
            "request_id": request_id,
        }
    )

# ===== Static Files - Widget Serving =====

# Serve ChatKit widget files
# Path from backend/app/main.py -> packages/widget/dist
widget_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "packages", "widget", "dist"))
if os.path.exists(widget_path):
    app.mount("/widget", StaticFiles(directory=widget_path), name="widget")
    print(f"✅ Widget files mounted at /widget from {widget_path}")
else:
    print(f"⚠️  Widget directory not found at {widget_path}")

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

# ===== Phase 13D: Metrics Tracking =====

from datetime import datetime as dt
import time

# Simple in-memory metrics (Phase 13D: Minimal metrics, not Prometheus cosplay)
class MetricsTracker:
    """Lightweight metrics tracker for operational visibility."""

    def __init__(self):
        self.startup_time = time.time()
        self.total_requests = 0
        self.error_count = 0
        self.rate_limit_hits = 0
        self.response_times = []  # Last 100 response times

    def record_request(self, response_time_ms: float, is_error: bool = False):
        """Record a request."""
        self.total_requests += 1
        if is_error:
            self.error_count += 1

        # Keep last 100 response times for avg calculation
        self.response_times.append(response_time_ms)
        if len(self.response_times) > 100:
            self.response_times.pop(0)

    def record_rate_limit(self):
        """Record a rate limit hit."""
        self.rate_limit_hits += 1

    def get_uptime_seconds(self) -> int:
        """Get server uptime in seconds."""
        return int(time.time() - self.startup_time)

    def get_avg_response_ms(self) -> float:
        """Get average response time in milliseconds."""
        if not self.response_times:
            return 0.0
        return sum(self.response_times) / len(self.response_times)

    def get_error_rate(self) -> float:
        """Get error rate as percentage."""
        if self.total_requests == 0:
            return 0.0
        return (self.error_count / self.total_requests) * 100

metrics = MetricsTracker()

# ===== Phase 13D: Observability Endpoints =====

@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Phase 13D: Minimal health signal for monitoring/load balancers.

    Returns:
        200: Service is healthy
        500: Service is unhealthy
    """
    try:
        # Check database connectivity
        db = next(get_db())
        try:
            # Simple query to verify DB is responsive
            db.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            log.error("health_check_db_failure", error=str(e))
            db_status = "disconnected"
        finally:
            db.close()

        # Health check response
        health_data = {
            "status": "ok" if db_status == "connected" else "degraded",
            "database": db_status,
            "uptime_seconds": metrics.get_uptime_seconds(),
        }

        # Return 200 if healthy, 500 if degraded
        status_code = 200 if db_status == "connected" else 500

        return JSONResponse(content=health_data, status_code=status_code)

    except Exception as e:
        log.error("health_check_failure", error=str(e))
        return JSONResponse(
            content={"status": "error", "database": "unknown", "uptime_seconds": 0},
            status_code=500
        )

@app.get("/metrics")
async def metrics_lite():
    """
    Lightweight metrics endpoint.

    Phase 13D: NOT Prometheus cosplay - just what matters for ops.

    Returns metrics:
    - total_requests: Total HTTP requests handled
    - error_rate: Percentage of requests that errored
    - rate_limit_hits: Number of rate limit triggers
    - avg_response_ms: Average response time (last 100 requests)
    - uptime_seconds: Server uptime

    Security: No secrets exposed.
    """
    return {
        "total_requests": metrics.total_requests,
        "error_count": metrics.error_count,
        "error_rate_percent": round(metrics.get_error_rate(), 2),
        "rate_limit_hits": metrics.rate_limit_hits,
        "avg_response_ms": round(metrics.get_avg_response_ms(), 2),
        "uptime_seconds": metrics.get_uptime_seconds(),
    }

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

    # Phase 11B: Rate limit check (backend authority)
    allowed, retry_after = rate_limiter.check_rate_limit(db, session.session_token, "save_chat")
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limited",
                "retry_after": retry_after
            }
        )

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

    # Phase 11B: Rate limit check (backend authority)
    allowed, retry_after = rate_limiter.check_rate_limit(db, session.session_token, "personalize")
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limited",
                "retry_after": retry_after
            }
        )

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
