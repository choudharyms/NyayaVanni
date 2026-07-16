from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded


def _rate_limit_key(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


limiter = Limiter(key_func=_rate_limit_key, headers_enabled=True)


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
