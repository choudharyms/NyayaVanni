from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os
import asyncio
from dotenv import load_dotenv
from slowapi.middleware import SlowAPIMiddleware
from middleware.rate_limit import limiter, rate_limit_handler
from slowapi.errors import RateLimitExceeded
from services.storage_service import cleanup_expired_documents

load_dotenv()

app = FastAPI(title="NyayaVanni API", description="Legal Document Analyzer API")

# Initialize search service with full-text indexing
from services.storage_service import DB_PATH as STORAGE_DB_PATH
from services.search_service import init_search_service
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
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "NyayaVanni Backend API is running."}

from api.routes import api_router, limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
