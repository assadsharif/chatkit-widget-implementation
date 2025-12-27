"""
Database Table Creation Script - Phase 10

Run this script to initialize the database with all required tables.

Usage:
    python create_tables.py

This will create all tables defined in app/models.py using SQLAlchemy.
"""

from app.database import engine, Base
from app.models import (
    User,
    Session,
    VerificationToken,
    SavedChat,
    AnonymousSession,
    RateLimit,
    AnalyticsEvent,
)

def create_tables():
    """
    Create all database tables.

    This is safe to run multiple times - SQLAlchemy will only create
    tables that don't already exist.
    """
    print("Creating database tables...")

    # Create all tables from Base metadata
    Base.metadata.create_all(bind=engine)

    print("✅ Database tables created successfully!")
    print("\nTables created:")
    print("  - users")
    print("  - sessions")
    print("  - verification_tokens")
    print("  - saved_chats")
    print("  - anonymous_sessions")
    print("  - rate_limits")
    print("  - analytics_events")

if __name__ == "__main__":
    create_tables()
