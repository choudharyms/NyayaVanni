import os
import re

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .middleware.rate_limit import limiter, rate_limit_handler
from .services.storage_service import cleanup_expired_documents

load_dotenv()

app = FastAPI(title="NyayaVanni API", description="Legal Document Analyzer API")


class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_upload_size:
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
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

# Set global limit to 11MB to safely allow the 10MB document uploads.
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

app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=11 * 1024 * 1024)

from .services.search_service import init_search_service
# Initialize search service with full-text indexing
from .services.storage_service import DB_PATH as STORAGE_DB_PATH

init_search_service(STORAGE_DB_PATH)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(Exception)
async def sanitized_exception_handler(request: Request, exc: Exception):
    """Catch-all handler that sanitizes error messages by removing internal file paths."""
    detail = "An internal error occurred."
    status_code = 500

    from fastapi import HTTPException
    from starlette.exceptions import HTTPException as StarletteHTTPException

    if isinstance(exc, (HTTPException, StarletteHTTPException)):
        status_code = exc.status_code
        detail = str(exc.detail)
    else:
        sanitized = re.sub(r"/[^\s]{10,}", "[path removed]", str(exc))

        import logging
        logger = logging.getLogger("uvicorn.error")
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


app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
