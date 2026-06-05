from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import os
from dotenv import load_dotenv

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
                        content={"detail": "Payload Too Large: The request body exceeds the maximum allowed limit."}
                    )
            except ValueError:
                pass  # Ignore invalid content-length values
        
        return await call_next(request)

# Set global limit to 11MB to safely allow the 10MB document uploads
app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=11 * 1024 * 1024)

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

from .api.routes import api_router
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
