from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from slowapi.middleware import SlowAPIMiddleware
from middleware.rate_limit import limiter, rate_limit_handler
from slowapi.errors import RateLimitExceeded


load_dotenv()

app = FastAPI(title="NyayaVanni API", description="Legal Document Analyzer API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
   allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)

@app.get("/")
def read_root():
    return {"message": "NyayaVanni Backend API is running."}

from api.routes import api_router
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
