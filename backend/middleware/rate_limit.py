import re
from collections import defaultdict
import time

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, headers_enabled=True)

_email_pattern = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
_email_submission_store: dict = defaultdict(list)
EMAIL_RATE_LIMIT_WINDOW = 60
EMAIL_RATE_LIMIT_MAX = 5


def _get_email_key(request: Request) -> str:
    """Rate limit key based on email address from request body."""
    try:
        body = request._body
        if body:
            import json
            data = json.loads(body)
            email = data.get("email", "").strip().lower()
            if email and _email_pattern.match(email):
                return f"email:{email}"
    except Exception:
        pass
    return get_remote_address(request)


def check_email_rate_limit(email: str) -> bool:
    """Check if an email address has exceeded the submission rate limit.

    Args:
        email: The email address to check.

    Returns:
        True if the request is allowed, False if rate limited.
    """
    now = time.time()
    key = email.strip().lower()
    _email_submission_store[key] = [
        t for t in _email_submission_store[key] if now - t < EMAIL_RATE_LIMIT_WINDOW
    ]
    if len(_email_submission_store[key]) >= EMAIL_RATE_LIMIT_MAX:
        return False
    _email_submission_store[key].append(now)
    return True


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for requests that exceed the rate limit."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )
