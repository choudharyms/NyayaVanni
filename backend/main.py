import asyncio
import logging
import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

from .middleware.rate_limit import limiter, rate_limit_handler
from .middleware.security import SecurityHeadersMiddleware
from .services.storage_service import cleanup_expired_documents

load_dotenv()

app = FastAPI(title="NyayaVanni API", description="Legal Document Analyzer API", debug=False)


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.request_id = str(uuid.uuid4())
        return await call_next(request)


class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_upload_size:
                    req_id = getattr(request.state, "request_id", None)
                    return JSONResponse(
                        status_code=413,
                        content={
                            "success": False,
                            "error": {
                                "code": 413,
                                "message": "Payload Too Large: The request body exceeds the maximum allowed limit.",
                            },
                            "request_id": req_id,
                        },
                    )
            except ValueError:
                pass

        return await call_next(request)


# Set global limit to 11MB to safely allow the 10MB document uploads.
app.add_middleware(RequestIDMiddleware)
app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=11 * 1024 * 1024)

from .services.search_service import init_search_service
# Initialize search service with full-text indexing
from .services.storage_service import DB_PATH as STORAGE_DB_PATH

init_search_service(STORAGE_DB_PATH)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

_SQL_PATTERNS = [
    "SELECT ", "INSERT ", "UPDATE ", "DELETE ", "DROP ", "ALTER ",
    "CREATE ", "TRUNCATE ", "EXEC ", "EXECUTE ", " UNION ", " OR ",
    " sqlite_master", "information_schema", " pg_",
]


def _strip_sql(msg: str) -> str:
    if not isinstance(msg, str):
        return msg
    lowered = msg.upper()
    for pat in _SQL_PATTERNS:
        if pat.upper() in lowered:
            return "An internal error occurred"
    return msg


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": _strip_sql(exc.detail),
            },
            "request_id": req_id,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    req_id = getattr(request.state, "request_id", None)
    errors = exc.errors()
    sanitized = []
    for err in errors:
        e = dict(err)
        if "msg" in e:
            e["msg"] = _strip_sql(e["msg"])
        sanitized.append(e)
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": 422,
                "message": "Validation error",
                "details": sanitized,
            },
            "request_id": req_id,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    req_id = getattr(request.state, "request_id", None)
    logger.error(f"Unhandled exception [request_id={req_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": 500,
                "message": "An internal server error occurred",
            },
            "request_id": req_id,
        },
    )


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize background tasks on application startup."""
    asyncio.create_task(cleanup_expired_documents())


# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Session-Id",
        "Accept",
        "Origin",
    ],
    max_age=3600,
)


@app.get("/")
def read_root() -> dict:
    """Health check endpoint to verify backend status."""
    return {"message": "NyayaVanni Backend API is running."}


from .api.routes import api_router

app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
