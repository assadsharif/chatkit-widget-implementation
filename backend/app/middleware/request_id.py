"""
Request ID Middleware - Phase 13A: Request Tracing & Correlation

Objective: Tie frontend action → backend request → log line → error with a single ID.

This middleware:
1. Extracts X-Request-ID from incoming request headers (if provided by frontend)
2. Generates new request ID if not provided (server-initiated requests)
3. Attaches request ID to:
   - request.state.request_id (accessible in route handlers)
   - Response headers (X-Request-ID)
   - All logs (via contextvars)

Guarantee: Every backend log line contains a request_id.
"""

import uuid
from contextvars import ContextVar
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Context variable for request ID (thread-safe, async-safe)
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    """
    Get the current request ID from context.

    Returns:
        str: Current request ID, or empty string if not set.
    """
    return request_id_ctx.get()


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware to generate or extract request IDs for tracing.

    Phase 13A: Request Tracing & Correlation

    Usage:
        app.add_middleware(RequestIDMiddleware)

    Headers:
        - Incoming: X-Request-ID (optional, from frontend)
        - Outgoing: X-Request-ID (always present in response)

    Request State:
        - request.state.request_id (str): Request ID for this request

    Context:
        - request_id_ctx (ContextVar): Global context variable for logging
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process each request and inject request ID.

        Args:
            request: Incoming FastAPI request
            call_next: Next middleware/handler in chain

        Returns:
            Response with X-Request-ID header
        """
        # Extract or generate request ID
        request_id = request.headers.get("X-Request-ID", "")

        if not request_id:
            # Generate new UUID if not provided by client
            request_id = uuid.uuid4().hex

        # Validate request ID (basic sanity check)
        # Accept: UUID hex (32 chars), UUID with hyphens (36 chars), or reasonable alphanumeric
        if not request_id or len(request_id) > 64 or not request_id.replace("-", "").isalnum():
            # Invalid request ID - generate new one for safety
            request_id = uuid.uuid4().hex

        # Attach to request state (accessible in route handlers)
        request.state.request_id = request_id

        # Set in context variable (accessible in logging)
        token = request_id_ctx.set(request_id)

        try:
            # Process request
            response = await call_next(request)

            # Attach request ID to response headers (echo back to client)
            response.headers["X-Request-ID"] = request_id

            return response
        finally:
            # Clean up context variable
            request_id_ctx.reset(token)
