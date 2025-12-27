"""
Database Models - Phase 10

SQLAlchemy models for persistent storage.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    """User account model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    email_verified = Column(Boolean, default=False)
    tier = Column(String, default="lightweight")  # lightweight, full, premium
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    saved_chats = relationship("SavedChat", back_populates="user", cascade="all, delete-orphan")
    analytics_events = relationship("AnalyticsEvent", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    """User session model"""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # NULL = never expires
    last_activity = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")


class VerificationToken(Base):
    """Email verification token model"""
    __tablename__ = "verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)


class SavedChat(Base):
    """Saved chat conversation model"""
    __tablename__ = "saved_chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    messages = Column(JSON, nullable=False)  # [{role: str, content: str}]
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="saved_chats")


class AnonymousSession(Base):
    """Anonymous session for migration"""
    __tablename__ = "anonymous_sessions"

    id = Column(Integer, primary_key=True, index=True)
    anon_id = Column(String, unique=True, index=True, nullable=False)
    messages = Column(JSON, nullable=False)  # [{role: str, content: str}]
    created_at = Column(DateTime, default=datetime.utcnow)


class RateLimit(Base):
    """Rate limit tracking model"""
    __tablename__ = "rate_limits"

    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String, index=True, nullable=False)
    action = Column(String, nullable=False)  # chat, save, personalize
    count = Column(Integer, default=0)
    window_start = Column(DateTime, default=datetime.utcnow)


class AnalyticsEvent(Base):
    """Analytics event model"""
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL for anonymous
    event_type = Column(String, index=True, nullable=False)  # signup, login, save_chat, personalize, etc.
    event_data = Column(JSON, nullable=True)  # Additional event metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="analytics_events")
