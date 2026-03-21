from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from services.storage_service import upload_to_local, save_document_record
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
        # Simplify MVP: if file is not provided, we should download it from S3.
        # But for quick testing, we can let the frontend send it.
        if not file:
            raise HTTPException(status_code=400, detail="File required for MVP analysis phase")
        
        contents = await file.read()
        
        # 1. OCR Extraction
        text = extract_document(contents, file.filename)
        
        # 2. RAG Retrieval
        relevant_laws = retrieve_relevant_laws(text, k=3)
        
        # 3. Gemini Analysis
        analysis_result = analyze_document_with_gemini(text, relevant_laws, language)
        
        # TODO: Update DynamoDB with analysis_result
        return {
            "documentId": document_id,
            "analysis": analysis_result,
            "extracted_text": text[:500] + "..." # Snippet
        }
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
