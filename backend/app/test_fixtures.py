"""
Test Fixtures - Phase 11A

Deterministic test fixtures for integration testing.

Provides:
- Seed test user
- Seed test session
- Predictable tokens for testing

Usage:
    INTEGRATION_TEST_MODE=true python -m app.test_fixtures
"""

from sqlalchemy.orm import Session
from app.database import get_db, Base, engine
from app.models import User, Session as DBSession, VerificationToken
from datetime import datetime, timedelta
import secrets

# Deterministic test data (DO NOT USE IN PRODUCTION)
TEST_USER_EMAIL = "test@integration.local"
TEST_USER_TIER = "lightweight"
TEST_SESSION_TOKEN = "integration-test-session-token-12345"
TEST_VERIFICATION_TOKEN = "integration-test-verification-token-67890"


def seed_test_user(db: Session) -> User:
    """
    Create or get deterministic test user.

    Returns:
        User: The test user
    """
    # Check if test user already exists
    user = db.query(User).filter(User.email == TEST_USER_EMAIL).first()

    if user:
        print(f"✅ Test user already exists: {TEST_USER_EMAIL}")
        return user

    # Create test user
    user = User(
        email=TEST_USER_EMAIL,
        email_verified=True,  # Pre-verified for testing
        tier=TEST_USER_TIER,
        created_at=datetime.utcnow(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"✅ Test user created: {TEST_USER_EMAIL} (ID: {user.id})")
    return user


def seed_test_session(db: Session, user: User) -> DBSession:
    """
    Create or get deterministic test session.

    Args:
        user: The test user

    Returns:
        DBSession: The test session
    """
    # Check if test session already exists
    session = db.query(DBSession).filter(DBSession.session_token == TEST_SESSION_TOKEN).first()

    if session:
        # Update expiry to ensure it's not expired
        session.expires_at = datetime.utcnow() + timedelta(hours=24)
        session.last_activity = datetime.utcnow()
        db.commit()
        print(f"✅ Test session already exists: {TEST_SESSION_TOKEN}")
        return session

    # Create test session
    session = DBSession(
        user_id=user.id,
        session_token=TEST_SESSION_TOKEN,
        expires_at=datetime.utcnow() + timedelta(hours=24),
        last_activity=datetime.utcnow(),
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    print(f"✅ Test session created: {TEST_SESSION_TOKEN} (User ID: {user.id})")
    return session


def seed_test_verification_token(db: Session) -> VerificationToken:
    """
    Create or get deterministic test verification token.

    Returns:
        VerificationToken: The test verification token
    """
    # Check if test token already exists
    token = db.query(VerificationToken).filter(VerificationToken.token == TEST_VERIFICATION_TOKEN).first()

    if token:
        # Update expiry to ensure it's not expired
        token.expires_at = datetime.utcnow() + timedelta(minutes=10)
        token.used = False
        db.commit()
        print(f"✅ Test verification token already exists: {TEST_VERIFICATION_TOKEN}")
        return token

    # Create test verification token
    token = VerificationToken(
        email=TEST_USER_EMAIL,
        token=TEST_VERIFICATION_TOKEN,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        used=False,
    )

    db.add(token)
    db.commit()
    db.refresh(token)

    print(f"✅ Test verification token created: {TEST_VERIFICATION_TOKEN}")
    return token


def setup_integration_test_fixtures():
    """
    Setup all integration test fixtures.

    This should be called on backend startup in INTEGRATION_TEST_MODE.
    """
    print("🧪 Setting up integration test fixtures...")

    # Initialize database
    Base.metadata.create_all(bind=engine)

    # Get database session
    db = next(get_db())

    try:
        # Seed test user
        user = seed_test_user(db)

        # Seed test session
        session = seed_test_session(db, user)

        # Seed test verification token
        token = seed_test_verification_token(db)

        print("✅ All integration test fixtures ready")
        print(f"   Test User: {TEST_USER_EMAIL}")
        print(f"   Test Session Token: {TEST_SESSION_TOKEN}")
        print(f"   Test Verification Token: {TEST_VERIFICATION_TOKEN}")

    except Exception as e:
        print(f"❌ Failed to setup test fixtures: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def get_test_credentials():
    """
    Get test credentials for integration testing.

    Returns:
        dict: Test credentials
    """
    return {
        "email": TEST_USER_EMAIL,
        "session_token": TEST_SESSION_TOKEN,
        "verification_token": TEST_VERIFICATION_TOKEN,
        "tier": TEST_USER_TIER,
    }


if __name__ == "__main__":
    # Allow running this module directly for manual fixture setup
    print("Running test fixtures setup...")
    setup_integration_test_fixtures()
