"""
Rate Limiter - Phase 11B

Backend-authoritative rate limiting.
Frontend may predict, backend must enforce.

Rate limits are stored in database and enforced on every request.
"""

from sqlalchemy.orm import Session
from app.models import RateLimit
from app import config
from datetime import datetime, timedelta
from typing import Tuple, Optional


def check_rate_limit(
    db: Session,
    session_token: str,
    action: str,
    max_requests: Optional[int] = None,
    window_seconds: Optional[int] = None
) -> Tuple[bool, int]:
    """
    Check if a request is rate-limited.

    Args:
        db: Database session
        session_token: User session token
        action: Action being performed (e.g., 'chat', 'save_chat', 'personalize')
        max_requests: Maximum requests allowed in window (defaults to config)
        window_seconds: Time window in seconds (defaults to config)

    Returns:
        Tuple[bool, int]: (allowed: bool, retry_after: seconds)
            - allowed=True, retry_after=0: Request allowed
            - allowed=False, retry_after=N: Request blocked, retry in N seconds
    """
    # Use config defaults if not provided
    if window_seconds is None:
        window_seconds = config.RATE_LIMIT_WINDOW_SECONDS

    if max_requests is None:
        # Action-specific limits
        if action == 'save_chat':
            max_requests = config.RATE_LIMIT_SAVE_CHAT
        elif action == 'personalize':
            max_requests = config.RATE_LIMIT_PERSONALIZE
        else:
            max_requests = config.RATE_LIMIT_MAX_REQUESTS

    # Calculate window start
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=window_seconds)

    # Get or create rate limit record
    rate_limit = db.query(RateLimit).filter(
        RateLimit.session_token == session_token,
        RateLimit.action == action
    ).first()

    if not rate_limit:
        # First request for this action - create record
        rate_limit = RateLimit(
            session_token=session_token,
            action=action,
            count=1,
            window_start=now
        )
        db.add(rate_limit)
        db.commit()
        return True, 0

    # Check if window has expired
    if rate_limit.window_start < window_start:
        # Window expired - reset counter
        rate_limit.count = 1
        rate_limit.window_start = now
        db.commit()
        return True, 0

    # Check if limit exceeded
    if rate_limit.count >= max_requests:
        # Rate limited - calculate retry_after
        window_end = rate_limit.window_start + timedelta(seconds=window_seconds)
        retry_after = int((window_end - now).total_seconds())
        retry_after = max(1, retry_after)  # Minimum 1 second
        return False, retry_after

    # Under limit - increment counter
    rate_limit.count += 1
    db.commit()
    return True, 0


def reset_rate_limit(db: Session, session_token: str, action: str) -> None:
    """
    Reset rate limit for a specific action.

    Useful for testing or administrative overrides.

    Args:
        db: Database session
        session_token: User session token
        action: Action to reset
    """
    rate_limit = db.query(RateLimit).filter(
        RateLimit.session_token == session_token,
        RateLimit.action == action
    ).first()

    if rate_limit:
        db.delete(rate_limit)
        db.commit()


def get_rate_limit_status(db: Session, session_token: str) -> dict:
    """
    Get current rate limit status for all actions.

    Useful for debugging and monitoring.

    Args:
        db: Database session
        session_token: User session token

    Returns:
        dict: Rate limit status for each action
    """
    rate_limits = db.query(RateLimit).filter(
        RateLimit.session_token == session_token
    ).all()

    status = {}
    now = datetime.utcnow()

    for rl in rate_limits:
        window_seconds = config.RATE_LIMIT_WINDOW_SECONDS
        window_end = rl.window_start + timedelta(seconds=window_seconds)
        remaining_seconds = int((window_end - now).total_seconds())

        # Get max requests for this action
        if rl.action == 'save_chat':
            max_requests = config.RATE_LIMIT_SAVE_CHAT
        elif rl.action == 'personalize':
            max_requests = config.RATE_LIMIT_PERSONALIZE
        else:
            max_requests = config.RATE_LIMIT_MAX_REQUESTS

        status[rl.action] = {
            "count": rl.count,
            "max": max_requests,
            "window_seconds": window_seconds,
            "remaining_seconds": max(0, remaining_seconds),
            "limited": rl.count >= max_requests and remaining_seconds > 0
        }

    return status
