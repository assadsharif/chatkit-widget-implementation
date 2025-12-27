"""
Services Module - Phase 10

Modular service layer for business logic.
"""

from app.services.email_service import email_service
from app.services.personalize_service import personalize_service
from app.services.analytics_service import analytics_service

__all__ = [
    "email_service",
    "personalize_service",
    "analytics_service",
]
