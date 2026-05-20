import os
from services.document_classifier import classify_document
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from services.storage_service import (
    upload_to_local, save_document_record, get_document_record,
    save_cached_analysis, get_cached_analysis
)
from services.ocr_service import extract_document
from services.rag_service import retrieve_relevant_laws
from services.gemini_service import analyze_document_with_gemini, generate_chat_response
from models.schemas import ChatRequest, ChatResponse
import json
import logging

logger = logging.getLogger(__name__)

api_router = APIRouter()

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

        # 1.5 Document Classification (NEW)
        classification = classify_document(text)
        
        # 2. RAG Retrieval
        relevant_laws = retrieve_relevant_laws(text, k=3)
        
        # 3. Gemini Analysis
        analysis_result = analyze_document_with_gemini(text, relevant_laws, language)
        
        # 4. Persist to cache so repeat requests are served instantly
        save_cached_analysis(document_id, language, text, analysis_result)

        return {
            "documentId": document_id,
            "analysis": analysis_result,
            "classification": classification,   # NEW
            "extracted_text": text[:500] + "...",
            "cached": False
        }

    except HTTPException as http_err:
        raise http_err
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Requested document file not found on storage.")
    except Exception as e:
        import traceback
        from google.api_core.exceptions import ResourceExhausted, InvalidArgument, GoogleAPIError
        
        trace = traceback.format_exc()
        logger.error(f"Analysis failed: {e}\n{trace}")
        
        # 1. Handle Gemini API Specific exceptions
        if isinstance(e, ResourceExhausted):
            raise HTTPException(
                status_code=429, 
                detail="AI Quota limit reached. Please wait a minute and try again."
            )
        elif isinstance(e, InvalidArgument):
            raise HTTPException(
                status_code=400, 
                detail="Invalid input structure. The document may be too long for the model."
            )
        elif isinstance(e, GoogleAPIError):
            raise HTTPException(
                status_code=502, 
                detail="Upstream AI Service error. Please try again in a few moments."
            )
            
        # 2. Handle configuration error explicitly
        if not os.getenv("GEMINI_API_KEY"):
            raise HTTPException(
                status_code=500, 
                detail="Server configuration issue: GEMINI_API_KEY environment variable is missing."
            )
            
        # 3. Handle third-party library errors specifically (e.g. PyMuPDF/fitz corrupted files)
        if "fitz" in str(e.__class__) or "FileDataError" in type(e).__name__:
            raise HTTPException(
                status_code=400, 
                detail="The uploaded document is corrupted or could not be parsed."
            )

        raise HTTPException(status_code=500, detail="An internal processing error occurred.")


@api_router.post("/chat/general", response_model=ChatResponse)
async def chat_general(request: ChatRequest):
    """General legal chat — no document context."""
    try:
        history = [{"role": msg.role, "message": msg.message} for msg in request.chat_history]
        text = generate_chat_response({}, history, request.user_message, request.language)
        return ChatResponse(response=text)
    except Exception as e:
        logger.error(f"General chat failed: {e}")
        raise HTTPException(status_code=500, detail="Chat generation failed")


@api_router.post("/chat/{document_id}", response_model=ChatResponse)
async def chat_with_document(document_id: str, request: ChatRequest):
    """Send chat message with document context loaded server-side."""
    try:
        cached = get_cached_analysis(document_id, request.language)
        analysis = cached["analysis"] if cached else {}

        history = [{"role": msg.role, "message": msg.message} for msg in request.chat_history]
        response_text = generate_chat_response(analysis, history, request.user_message, request.language)

        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Chat failed for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Chat generation failed")
