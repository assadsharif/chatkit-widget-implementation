"""
Structured Logger - Phase 13B: Structured Logging

Objective: Logs are machine-readable, not vibes-readable.

This module provides structured JSON logging that:
1. Always includes request_id from context
2. Never logs secrets or tokens
3. Outputs machine-readable JSON format
4. Supports multiple log levels (INFO, WARNING, ERROR, DEBUG)

Replaces all print() statements across the application.
"""

import json
import sys
from datetime import datetime
from typing import Any, Dict, Optional

from app.middleware.request_id import get_request_id


class StructuredLogger:
    """
    Structured JSON logger for production observability.

    Phase 13B: Machine-readable logs with automatic request ID injection.

    Usage:
        from app.logger import log

        log.info("user_authenticated", user_id="123", tier="lightweight")
        log.error("rate_limit_exceeded", endpoint="/chat/save", retry_after=17)
        log.warning("token_refresh_failed", reason="expired")
        log.debug("cache_hit", key="session_token_abc123")
    """

    def __init__(self, service_name: str = "chatkit-backend"):
        """
        Initialize structured logger.

        Args:
            service_name: Name of the service (for log aggregation)
        """
        self.service_name = service_name

    def _log(
        self,
        level: str,
        event: str,
        **kwargs: Any
    ) -> None:
        """
        Internal log method - outputs structured JSON.

        Args:
            level: Log level (INFO, WARNING, ERROR, DEBUG)
            event: Event name (snake_case, descriptive)
            **kwargs: Additional context fields

        Output Format:
            {
              "timestamp": "2025-01-01T12:34:56.789Z",
              "level": "INFO",
              "service": "chatkit-backend",
              "event": "user_authenticated",
              "request_id": "abc123...",
              "user_id": "123",
              "tier": "lightweight"
            }
        """
        # Build log entry
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "service": self.service_name,
            "event": event,
        }

        # Inject request ID from context (Phase 13A)
        request_id = get_request_id()
        if request_id:
            log_entry["request_id"] = request_id

        # Add custom fields
        log_entry.update(kwargs)

        # Sanitize sensitive fields (Phase 12 security)
        log_entry = self._sanitize(log_entry)

        # Output as JSON
        json_output = json.dumps(log_entry, default=str)
        print(json_output, file=sys.stdout, flush=True)

    def _sanitize(self, log_entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize log entry to remove sensitive data.

        Phase 12 (11C): Never log tokens or secrets.

        Args:
            log_entry: Log entry dictionary

        Returns:
            Sanitized log entry
        """
        SENSITIVE_KEYS = {
            "token",
            "session_token",
            "password",
            "secret",
            "api_key",
            "authorization",
            "verification_token",
            "SECRET_KEY",
            "DATABASE_URL",
        }

        sanitized = {}
        for key, value in log_entry.items():
            # Check if key is sensitive (case-insensitive)
            if key.lower() in SENSITIVE_KEYS or "token" in key.lower():
                sanitized[key] = "[REDACTED]"
            # Recursively sanitize nested dicts
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize(value)
            else:
                sanitized[key] = value

        return sanitized

    def info(self, event: str, **kwargs: Any) -> None:
        """
        Log informational event.

        Args:
            event: Event name (e.g., "user_authenticated", "chat_saved")
            **kwargs: Event context

        Example:
            log.info("user_authenticated", user_id="123", tier="lightweight")
        """
        self._log("INFO", event, **kwargs)

    def warning(self, event: str, **kwargs: Any) -> None:
        """
        Log warning event.

        Args:
            event: Event name (e.g., "token_refresh_failed", "deprecated_api_used")
            **kwargs: Event context

        Example:
            log.warning("token_refresh_failed", reason="expired", user_id="123")
        """
        self._log("WARNING", event, **kwargs)

    def error(self, event: str, **kwargs: Any) -> None:
        """
        Log error event.

        Args:
            event: Event name (e.g., "rate_limit_exceeded", "database_error")
            **kwargs: Event context

        Example:
            log.error("rate_limit_exceeded", endpoint="/chat/save", retry_after=17)
        """
        self._log("ERROR", event, **kwargs)

    def debug(self, event: str, **kwargs: Any) -> None:
        """
        Log debug event.

        Args:
            event: Event name (e.g., "cache_hit", "query_executed")
            **kwargs: Event context

        Example:
            log.debug("cache_hit", key="session_token_abc123")
        """
        self._log("DEBUG", event, **kwargs)


# Global logger instance
log = StructuredLogger()
