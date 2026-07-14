from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, headers_enabled=True)


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for requests that exceed the rate limit."""
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": {
                "code": 429,
                "message": "Rate limit exceeded. Please try again later.",
            },
            "request_id": req_id,
        },
    )
