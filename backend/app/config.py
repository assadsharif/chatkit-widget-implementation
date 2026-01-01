"""
Configuration Module - Phase 11A + Phase 13B

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

    Phase 12 (11C complete): Security hardening - fail fast on missing secrets.
    """
    # Always required - crash if missing
    if not DATABASE_URL:
        raise ValueError(
            "❌ FATAL: DATABASE_URL environment variable is not set. "
            "Set DATABASE_URL to a valid database connection string."
        )

    # Production mode: Strict validation (crash early)
    if not INTEGRATION_TEST_MODE:
        # SECRET_KEY must be set and not using default value
        if not os.getenv("SECRET_KEY"):
            raise ValueError(
                "❌ FATAL: SECRET_KEY environment variable is not set in production mode.\n"
                "   Set SECRET_KEY to a cryptographically secure random value (256-bit recommended).\n"
                "   Example: export SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
            )

        if SECRET_KEY == "dev-secret-key-change-in-production":
            raise ValueError(
                "❌ FATAL: SECRET_KEY is using the default development value in production mode.\n"
                "   This is a critical security vulnerability.\n"
                "   Set SECRET_KEY environment variable to a unique random value.\n"
                "   Example: export SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
            )

        # Database warnings (not fatal, but important)
        if DATABASE_URL.startswith("sqlite"):
            print("=" * 80)
            print("⚠️  WARNING: Using SQLite in production mode.")
            print("   SQLite is not recommended for production. Consider PostgreSQL or MySQL.")
            print("   Set DATABASE_URL to a production database connection string.")
            print("=" * 80)

        # Success message
        print("✅ Security validation passed: All required secrets are set")
    else:
        # Integration test mode: Lenient validation
        print("🧪 Integration test mode: Using development configuration")


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
