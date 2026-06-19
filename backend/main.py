import asyncio
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
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


# Set global limit to 11MB to safely allow the 10MB document uploads.
app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=11 * 1024 * 1024)

from .services.search_service import init_search_service
# Initialize search service with full-text indexing
from .services.storage_service import DB_PATH as STORAGE_DB_PATH

init_search_service(STORAGE_DB_PATH)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_expired_documents())


# Configure CORS for React frontend
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


@app.get("/")
def read_root():
    return {"message": "NyayaVanni Backend API is running."}


from .api.routes import api_router, limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
