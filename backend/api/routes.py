from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from services.storage_service import (
    upload_to_local, save_document_record, get_document_record,
    save_cached_analysis, get_cached_analysis
)
from services.ocr_service import extract_document
from services.rag_service import retrieve_relevant_laws
from services.gemini_service import analyze_document_with_gemini, generate_chat_response
from models.schemas import ChatRequest, ChatResponse
from config import Config
from flask_bcrypt import Bcrypt
from MySQLdb.cursors import DictCursor
from dbutils.pooled_db import PooledDB
import MySQLdb
import jwt
import datetime
import json
import logging
from utils.validators import is_valid_email, is_strong_password

logger = logging.getLogger(__name__)
bcrypt = Bcrypt()

api_router = APIRouter()

# Connection pool - initialized once
db_pool = None

def init_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = PooledDB(
            creator=MySQLdb,
            maxconnections=5,
            mincached=1,
            maxcached=3,
            blocking=True,
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            passwd=Config.MYSQL_PASSWORD,
            db=Config.MYSQL_DB,
            charset="utf8mb4",
            cursorclass=DictCursor,
        )
    return db_pool

def get_db_connection():
    pool = init_db_pool()
    return pool.connection()



def register_payload(data):
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="All fields are required")

    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    if not is_strong_password(password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain uppercase, lowercase, number and 8+ chars",
        )

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
        
        cur.execute(
            "INSERT INTO users(name, email, password) VALUES(%s, %s, %s)",
            (name, email, hashed_password),
        )
        conn.commit()
        return {"message": "User Registered Successfully"}
    except MySQLdb.IntegrityError as e:
        conn.rollback()
        if "Duplicate entry" in str(e) and "email" in str(e):
            raise HTTPException(status_code=409, detail="Email already exists")
        raise HTTPException(status_code=400, detail="Database constraint violation")
    finally:
        cur.close()
        conn.close()


def login_payload(data):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cur.fetchone()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid Email or Password")

        stored_password = user["password"]

        if not bcrypt.check_password_hash(stored_password, password):
            raise HTTPException(status_code=401, detail="Invalid Email or Password")

        token = jwt.encode(
            {
                "id": user["id"],
                "email": user["email"],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            },
            Config.JWT_SECRET,
            algorithm="HS256",
        )

        return {"message": "Login Successful", "token": token}
    finally:
        cur.close()
        conn.close()


@api_router.post("/register")
async def register(request: Request):
    try:
        data = await request.json()
        return register_payload(data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/login")
async def login(request: Request):
    try:
        data = await request.json()
        return login_payload(data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload document to S3 and return documentId"""
    try:
        contents = await file.read()
        doc_id, local_path = upload_to_local(contents, file.filename)
        # Assuming dummy user 'user_123' for MVP
        save_document_record("user_123", doc_id, file.filename, local_path)
        return {"documentId": doc_id, "message": "Uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/analyze/{document_id}")
async def analyze_document(document_id: str, language: str = "en", file: UploadFile = File(None)):
    """
    Trigger full analysis pipeline.
    For this MVP, we optionally accept the file again if we don't download from S3 to save time.
    Ideally, we read s3_key from DynamoDB and fetch from S3.
    """
    try:
        # ── Cache-first ──────────────────────────────────────────────────────────
        cached = get_cached_analysis(document_id, language)
        if cached:
            logger.info(f"Cache HIT for document {document_id} [{language}]")
            return {
                "documentId": document_id,
                "analysis": cached["analysis"],
                "extracted_text": cached["extracted_text"][:500] + "...",
                "cached": True
            }
        # ── Cache MISS: run the full pipeline ────────────────────────────────────
        # Simplify MVP: if file is not provided, we download it from local storage via SQLite metadata.
        if not file:
            record = get_document_record(document_id)
            if not record or not record.get("local_path"):
                raise HTTPException(status_code=404, detail="Document not found or file missing")
            
            try:
                with open(record["local_path"], "rb") as f:
                    contents = f.read()
            except IOError:
                raise HTTPException(status_code=500, detail="Failed to read document from storage")
            
            filename = record["filename"]
        else:
            contents = await file.read()
            filename = file.filename
        
        # 1. OCR Extraction
        text = extract_document(contents, filename)
        
        # 2. RAG Retrieval
        relevant_laws = retrieve_relevant_laws(text, k=3)
        
        # 3. Gemini Analysis
        analysis_result = analyze_document_with_gemini(text, relevant_laws, language)
        
        # 4. Persist to cache so repeat requests are served instantly
        save_cached_analysis(document_id, language, text, analysis_result)

        return {
            "documentId": document_id,
            "analysis": analysis_result,
            "extracted_text": text[:500] + "...",
            "cached": False
        }
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        logger.error(f"Analysis failed: {e}\n{trace}")
        
        detail_msg = str(e)
        if "429" in str(e) or "Quota exceeded" in str(e):
            raise HTTPException(status_code=429, detail="AI Quota limit reached. Please wait a minute and try again.")
            
        raise HTTPException(status_code=500, detail="An internal processing error occurred.")


@api_router.post("/chat/{document_id}", response_model=ChatResponse)
async def chat_with_document(document_id: str, request: ChatRequest):
    """Send chat message with context"""
    try:
        # In full production, fetch analysis and history from DynamoDB
        analysis = request.document_analysis or {}
        
        # Format history
        history = [{"role": msg.role, "message": msg.message} for msg in request.chat_history]
        
        response_text = generate_chat_response(analysis, history, request.user_message, request.language)
        
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail="Chat generation failed")
