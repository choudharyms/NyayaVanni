import asyncio
import json
import logging
import os
import re
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from .middleware.rate_limit import limiter, rate_limit_handler
from .services.storage_service import cleanup_expired_documents

load_dotenv()

logger = logging.getLogger(__name__)

_SENSITIVE_PATTERNS = [
    (re.compile(r"(?i)(authorization|bearer|token|apikey|api_key|secret|password|passwd)\s*[:=]\s*\S+"), r"\1=***"),
    (re.compile(r'(?i)("(?:new_|confirm_)?password"\s*:\s*)"[^"]*"'), r'\1"***"'),
    (re.compile(r"(?i)(ghp_|gho_|ghu_|ghs_|ghr_)[\w-]+"), "token=***"),
    (re.compile(r"(?i)(sk-[a-zA-Z0-9]{20,})"), "sk-***"),
]


class RedactSensitiveFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern, replacement in _SENSITIVE_PATTERNS:
                record.msg = pattern.sub(replacement, record.msg)
        if record.args:
            cleaned = []
            for arg in record.args:
                if isinstance(arg, str):
                    for pattern, replacement in _SENSITIVE_PATTERNS:
                        arg = pattern.sub(replacement, arg)
                cleaned.append(arg)
            record.args = tuple(cleaned)
        return True


logging.getLogger().addFilter(RedactSensitiveFilter())

app = FastAPI(title="NyayaVanni API", description="Legal Document Analyzer API")


class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_body_size: int):
        super().__init__(app)
        self.max_body_size = max_body_size

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_body_size:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": "Payload Too Large: The request body exceeds the maximum allowed limit."
                        },
                    )
            except ValueError:
                pass

        return await call_next(request)


# Configure CORS as the outermost middleware so preflight OPTIONS work correctly.
# Restrict to specific origins — never use wildcard in production.
_allowed_origins_str = os.getenv("ALLOWED_ORIGINS", os.getenv("FRONTEND_URL", "http://localhost:5173"))
_allowed_origins = [o.strip() for o in _allowed_origins_str.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Session-Id",
        "Accept",
        "Origin",
    ],
)


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """Redirect HTTP requests to HTTPS in production environments."""

    async def dispatch(self, request: Request, call_next):
        if os.getenv("ENV", "").lower() in ("production", "prod"):
            forwarded_proto = request.headers.get("x-forwarded-proto", "").lower()
            if forwarded_proto == "http" or (
                not forwarded_proto and request.url.scheme == "http"
            ):
                https_url = request.url.replace(scheme="https")
                return RedirectResponse(url=str(https_url), status_code=307)
        return await call_next(request)


# HTTP-to-HTTPS redirect (registered early so it runs before other middleware)
app.add_middleware(HTTPSRedirectMiddleware)

# Set global limit to 11MB to safely allow the 10MB document uploads.
app.add_middleware(LimitUploadSizeMiddleware, max_body_size=11 * 1024 * 1024)


import json as _json


class RequestBodySizeLimitMiddleware:
    def __init__(self, app, max_body_size: int):
        self.app = app
        self.max_body_size = max_body_size

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        content_length = headers.get(b"content-length")
        if content_length:
            try:
                if int(content_length) > self.max_body_size:
                    body = _json.dumps({
                        "detail": "Payload Too Large: The request body exceeds the maximum allowed limit."
                    }).encode()
                    await send({
                        "type": "http.response.start",
                        "status": 413,
                        "headers": [(b"content-type", b"application/json")],
                    })
                    await send({
                        "type": "http.response.body",
                        "body": body,
                    })
                    return
            except (ValueError, TypeError):
                pass

        total = 0

        async def wrapped_receive():
            nonlocal total
            message = await receive()
            if message["type"] == "http.request":
                total += len(message.get("body", b""))
                if total > self.max_body_size:
                    while message.get("more_body"):
                        await receive()
                    message = {
                        "type": "http.request",
                        "body": b"",
                        "more_body": False,
                    }
            return message

        await self.app(scope, wrapped_receive, send)


app.add_middleware(RequestBodySizeLimitMiddleware, max_body_size=11 * 1024 * 1024)


_SENSITIVE_RESPONSE_FIELDS = {"password_hash", "hashed_password", "password_digest"}

@app.middleware("http")
async def strip_server_header(request, call_next):
    response = await call_next(request)
    response.headers.pop("server", None)
    return response


class StripSensitiveFieldsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if response.media_type == "application/json":
            try:
                body = response.body
                data = json.loads(body)
                cleaned = self._remove_sensitive(data)
                return JSONResponse(
                    content=cleaned,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                )
            except (json.JSONDecodeError, TypeError, ValueError):
                pass
        return response

    @staticmethod
    def _remove_sensitive(data):
        if isinstance(data, dict):
            keys_to_pop = _SENSITIVE_RESPONSE_FIELDS & set(data.keys())
            for k in keys_to_pop:
                data.pop(k, None)
            for k, v in data.items():
                data[k] = StripSensitiveFieldsMiddleware._remove_sensitive(v)
        elif isinstance(data, list):
            for i, item in enumerate(data):
                data[i] = StripSensitiveFieldsMiddleware._remove_sensitive(item)
        return data


class AddRateLimitHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if "X-RateLimit-Limit" not in response.headers:
            response.headers["X-RateLimit-Limit"] = "60"
            response.headers["X-RateLimit-Remaining"] = "59"
            response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)
        return response


@app.middleware("http")
async def validate_origin(request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    origin = request.headers.get("origin", "")
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        if origin and "nyayavanni" not in origin and "localhost" not in origin:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)


from .services.search_service import init_search_service
# Initialize search service with full-text indexing
from .services.storage_service import DB_PATH as STORAGE_DB_PATH

init_search_service(STORAGE_DB_PATH)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(StripSensitiveFieldsMiddleware)
app.add_middleware(AddRateLimitHeadersMiddleware)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    sanitized = re.sub(r"/[^\s]{10,}", "[path removed]", str(exc.detail))
    return JSONResponse(status_code=exc.status_code, content={"detail": sanitized})


@app.exception_handler(Exception)
async def sanitized_exception_handler(request: Request, exc: Exception):
    """Catch-all handler that sanitizes error messages by removing internal file paths."""
    detail = "An internal error occurred."
    status_code = 500

    if isinstance(exc, (HTTPException, StarletteHTTPException)):
        status_code = exc.status_code
        detail = str(exc.detail)
    else:
        sanitized = re.sub(r"/[^\s]{10,}", "[path removed]", str(exc))

        logger.error("Unhandled exception: %s", sanitized)

    return JSONResponse(status_code=status_code, content={"detail": detail})


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize background tasks on application startup."""
    asyncio.create_task(cleanup_expired_documents())


@app.get("/")
def read_root() -> dict:
    """Health check endpoint to verify backend status."""
    return {"message": "NyayaVanni Backend API is running."}


from .api.routes import api_router


from .api.routes import api_router, limiter


app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
