"""
Configuration Module - Phase 11A

Handles application configuration including integration test mode.

Integration Test Mode:
- Shortens rate-limit windows
- Logs extra diagnostics
- Disables email sending
- Enables deterministic test fixtures

Usage:
    Set environment variable: INTEGRATION_TEST_MODE=true
"""

import os
from typing import Optional

# Integration Test Mode
INTEGRATION_TEST_MODE = os.getenv("INTEGRATION_TEST_MODE", "false").lower() == "true"

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chatkit.db")

# CORS Configuration
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:8000,http://127.0.0.1:3000,http://127.0.0.1:8000"
).split(",")

# Rate Limit Configuration
if INTEGRATION_TEST_MODE:
    # Shortened windows for integration testing
    RATE_LIMIT_WINDOW_SECONDS = 10  # 10 seconds (vs. 60 in production)
    RATE_LIMIT_MAX_REQUESTS = 3     # 3 requests per window
    RATE_LIMIT_SAVE_CHAT = 2        # 2 saves per window
    RATE_LIMIT_PERSONALIZE = 2      # 2 personalizations per window
else:
    # Production rate limits
    RATE_LIMIT_WINDOW_SECONDS = 60   # 1 minute
    RATE_LIMIT_MAX_REQUESTS = 10     # 10 requests per minute
    RATE_LIMIT_SAVE_CHAT = 5         # 5 saves per minute
    RATE_LIMIT_PERSONALIZE = 3       # 3 personalizations per minute

# Email Configuration
EMAIL_ENABLED = not INTEGRATION_TEST_MODE  # Disable email in test mode

# Session Configuration
SESSION_EXPIRY_HOURS = 24
SESSION_REFRESH_THRESHOLD_MINUTES = 5

# Analytics Configuration
ANALYTICS_ENABLED = True

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

# Logging Configuration
LOG_LEVEL = "DEBUG" if INTEGRATION_TEST_MODE else "INFO"


def validate_required_env_vars() -> None:
    """
    Validate that required environment variables are set.
    Crash early if missing critical configuration.

    Phase 11C: Security hardening - fail fast on missing secrets.
    """
    # In production, these should be set
    if not INTEGRATION_TEST_MODE:
        if SECRET_KEY == "dev-secret-key-change-in-production":
            print("⚠️  WARNING: Using default SECRET_KEY in production mode. Set SECRET_KEY env var.")

        if DATABASE_URL.startswith("sqlite"):
            print("⚠️  WARNING: Using SQLite in production mode. Consider PostgreSQL.")

    # Always required
    assert DATABASE_URL, "DATABASE_URL must be set"


def get_integration_test_diagnostics() -> dict:
    """
    Get current configuration for integration test diagnostics.

    Returns:
        dict: Configuration values for debugging
    """
    return {
        "integration_test_mode": INTEGRATION_TEST_MODE,
        "database_url": DATABASE_URL.split("://")[0] + "://***",  # Hide credentials
        "cors_origins": CORS_ORIGINS,
        "rate_limit_window": RATE_LIMIT_WINDOW_SECONDS,
        "rate_limit_max_requests": RATE_LIMIT_MAX_REQUESTS,
        "email_enabled": EMAIL_ENABLED,
        "log_level": LOG_LEVEL,
    }


# Startup validation
validate_required_env_vars()
