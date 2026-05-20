import os
from services.knowledge_graph_service import LegalKnowledgeGraphBuilder
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from services.storage_service import (
    upload_to_local, save_document_record, get_document_record,
  save_cached_analysis, get_cached_analysis,
    create_session_id,
    delete_document_and_cache,
    UPLOAD_DIR
 main
)
import uuid
from services.ocr_service import extract_document
from services.rag_service import retrieve_relevant_laws
from services.gemini_service import analyze_document_with_gemini, generate_chat_response
from models.schemas import ChatRequest, ChatResponse
import json
import logging

logger = logging.getLogger(__name__)

api_router = APIRouter()
 feature/legal-knowledge-graph
graph_builder = LegalKnowledgeGraphBuilder()
@api_router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload document to S3 and return documentId"""
    try:
        contents = await file.read()
        doc_id, local_path = upload_to_local(contents, file.filename)
        # Assuming dummy user 'user_123' for MVP
        save_document_record("user_123", doc_id, file.filename, local_path)

# Upload validation constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
ALLOWED_MIME_TYPES = {'application/pdf', 'image/png', 'image/jpeg'}


def require_session_id(request: Request) -> str:
    session_id = request.headers.get("x-session-id", "").strip()
    if not session_id:
        raise HTTPException(status_code=401, detail="Missing X-Session-Id header")
    return session_id


def require_document_owner(document_id: str, session_id: str) -> dict:
    record = get_document_record(document_id)
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")
    if record.get("session_id") != session_id:
        raise HTTPException(status_code=403, detail="Access denied for this document")
    return record


@api_router.get("/session")
async def create_session():
    return {"sessionId": create_session_id()}


@api_router.post("/upload")
async def upload_document(request: Request, file: UploadFile = File(...)):
    """Upload document and return documentId"""
    try:
        session_id = require_session_id(request)
        
        # 1. Validate file extension and MIME type
        filename = file.filename
        if not filename:
            raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename.")
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file format or MIME type. Only PDF, PNG, JPG, and JPEG are allowed."
            )
            
        # 2. Generate unique document ID and local file path
        doc_id = str(uuid.uuid4())
        local_path = os.path.join(UPLOAD_DIR, f"{doc_id}.{ext}")
        
        # 3. Stream write to disk to prevent OOM / high memory consumption
        size = 0
        try:
            with open(local_path, "wb") as buffer:
                while chunk := await file.read(1024 * 1024):  # 1MB chunks
                    size += len(chunk)
                    if size > MAX_FILE_SIZE:
                        raise HTTPException(
                            status_code=413, 
                            detail="File size exceeds the maximum allowed limit of 10MB."
                        )
                    buffer.write(chunk)
        except HTTPException as http_exc:
            # Delete partial file if limit is exceeded
            if os.path.exists(local_path):
                os.remove(local_path)
            raise http_exc
        except Exception as e:
            # Clean up on write failure
            if os.path.exists(local_path):
                os.remove(local_path)
            raise HTTPException(status_code=500, detail=f"File save failed: {str(e)}")
            
        # 4. Save metadata record to SQLite
        save_document_record(session_id, doc_id, filename, local_path)

        return {"documentId": doc_id, "message": "Uploaded successfully"}
        
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/analyze/{document_id}")
async def analyze_document(
    document_id: str,
    language: str = "en",
    file: UploadFile = File(None)
):
    """
    Trigger full analysis pipeline.
    """

    try:
        # ── Cache-first ─────────────────────────────────────────────────────
        cached = get_cached_analysis(document_id, language)

        if cached:
            logger.info(f"Cache HIT for document {document_id} [{language}]")

            knowledge_graph = graph_builder.generate_graph(
                cached["extracted_text"]
            )

            return {
                "documentId": document_id,
                "analysis": cached["analysis"],
                "knowledge_graph": knowledge_graph,
                "extracted_text": cached["extracted_text"][:500] + "...",
                "cached": True
            }

        # ── Cache MISS: run full pipeline ──────────────────────────────────

        if not file:
            record = get_document_record(document_id)

            if not record or not record.get("local_path"):
                raise HTTPException(
                    status_code=404,
                    detail="Document not found or file missing"
                )

            try:
                with open(record["local_path"], "rb") as f:
                    contents = f.read()

            except IOError:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to read document from storage"
                )

            filename = record["filename"]

        else:
            contents = await file.read()
            filename = file.filename

        # 1. OCR Extraction
        text = extract_document(contents, filename)

        # 2. RAG Retrieval
        relevant_laws = retrieve_relevant_laws(text, k=3)

        # 3. Gemini Analysis
        analysis_result = analyze_document_with_gemini(
            text,
            relevant_laws,
            language
        )

        # 4. Generate Knowledge Graph
        knowledge_graph = graph_builder.generate_graph(text)

        # 5. Save cache
        save_cached_analysis(
            document_id,
            language,
            text,
            analysis_result
        )

        return {
            "documentId": document_id,
            "analysis": analysis_result,
            "knowledge_graph": knowledge_graph,
            "extracted_text": text[:500] + "...",
            "cached": False
        }

    except HTTPException as http_err:
        raise http_err

    except ValueError as val_err:
        raise HTTPException(
            status_code=400,
            detail=str(val_err)
        )

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Requested document file not found on storage."
        )

    except Exception as e:
        import traceback
        from google.api_core.exceptions import (
            ResourceExhausted,
            InvalidArgument,
            GoogleAPIError
        )

        trace = traceback.format_exc()
        logger.error(f"Analysis failed: {e}\n{trace}")

        # Gemini quota
        if isinstance(e, ResourceExhausted):
            raise HTTPException(
                status_code=429,
                detail="AI Quota limit reached. Please wait a minute and try again."
            )

        # Invalid request
        elif isinstance(e, InvalidArgument):
            raise HTTPException(
                status_code=400,
                detail="Invalid input structure. The document may be too long for the model."
            )

        # Gemini upstream issue
        elif isinstance(e, GoogleAPIError):
            raise HTTPException(
                status_code=502,
                detail="Upstream AI Service error. Please try again in a few moments."
            )

        # Missing env key
        if not os.getenv("GEMINI_API_KEY"):
            raise HTTPException(
                status_code=500,
                detail="Server configuration issue: GEMINI_API_KEY environment variable is missing."
            )

        # Corrupt document
        if "fitz" in str(e.__class__) or "FileDataError" in type(e).__name__:
            raise HTTPException(
                status_code=400,
                detail="The uploaded document is corrupted or could not be parsed."
            )

 feature/legal-knowledge-graph
        raise HTTPException(
            status_code=500,
            detail="An internal processing error occurred."
        )

        raise HTTPException(status_code=500, detail="An internal processing error occurred.")


@api_router.post("/chat/general", response_model=ChatResponse)
async def chat_general(request: ChatRequest):
    """General legal chat — no document context."""
    try:
        # Validate user message is not empty
        if not request.user_message or not request.user_message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        analysis = request.document_analysis or {}

        history = [
            {"role": msg.role, "message": msg.message}
            for msg in request.chat_history
        ]

        text = generate_chat_response(
            analysis,
            history,
            request.user_message,
            request.language
        )

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
 feature/legal-knowledge-graph
        raise HTTPException(status_code=500, detail="Chat generation failed")

        raise HTTPException(status_code=500, detail="Chat generation failed")

        
@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, request: Request):
    session_id = require_session_id(request)
    require_document_owner(document_id, session_id)

    deleted = delete_document_and_cache(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"documentId": document_id, "deleted": True}

