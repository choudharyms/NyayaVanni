from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, headers_enabled=True)


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for requests that exceed the rate limit."""
    response = JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )
    # Inject X-RateLimit-* headers and Retry-After so clients can back off.
    # view_rate_limit is populated by slowapi's limit decorator before the
    # handler is invoked.
    view_rate_limit = getattr(request.state, "view_rate_limit", None)
    if view_rate_limit is not None:
        response = limiter._inject_headers(response, view_rate_limit)
    return response
