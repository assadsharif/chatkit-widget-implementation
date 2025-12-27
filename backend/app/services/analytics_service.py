"""
Analytics Service - Phase 10

Track user interactions and events for insights.
"""

from sqlalchemy.orm import Session
from app.models import AnalyticsEvent, User
from typing import Optional, Dict
from datetime import datetime

class AnalyticsService:
    """Analytics event tracking service"""

    async def log_event(
        self,
        db: Session,
        event_type: str,
        user_email: Optional[str] = None,
        event_data: Optional[Dict] = None
    ) -> AnalyticsEvent:
        """
        Log an analytics event.

        Event types:
        - signup: User signed up
        - login: User logged in
        - email_verified: User verified email
        - save_chat: User saved a chat
        - personalize: User requested personalization
        - chat_message: User sent a chat message
        - anonymous_to_authenticated: User migrated from anonymous
        - logout: User logged out
        """

        # Get user_id if email provided
        user_id = None
        if user_email:
            user = db.query(User).filter(User.email == user_email).first()
            if user:
                user_id = user.id

        # Create event
        event = AnalyticsEvent(
            user_id=user_id,
            event_type=event_type,
            event_data=event_data or {},
            created_at=datetime.utcnow()
        )

        db.add(event)
        db.commit()
        db.refresh(event)

        print(f"📊 ANALYTICS EVENT LOGGED")
        print(f"   Type: {event_type}")
        print(f"   User: {user_email or 'anonymous'}")
        print(f"   Data: {event_data}")

        return event

    async def get_user_stats(self, db: Session, user_email: str) -> Dict:
        """
        Get analytics stats for a user.

        Returns:
        - total_chats: Total chat messages sent
        - total_saves: Total chats saved
        - total_personalizations: Total personalization requests
        - signup_date: User signup date
        - last_activity: Last activity timestamp
        """

        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            return {}

        events = db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == user.id).all()

        stats = {
            "total_chats": sum(1 for e in events if e.event_type == "chat_message"),
            "total_saves": sum(1 for e in events if e.event_type == "save_chat"),
            "total_personalizations": sum(1 for e in events if e.event_type == "personalize"),
            "signup_date": user.created_at.isoformat(),
            "last_activity": max((e.created_at for e in events), default=user.created_at).isoformat(),
        }

        return stats

# Singleton instance
analytics_service = AnalyticsService()
