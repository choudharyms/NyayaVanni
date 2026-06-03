import os
import uuid
import logging
import io

from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from services.document_classifier import classify_document
from services.knowledge_graph_service import LegalKnowledgeGraphBuilder
from services.storage_service import (
    upload_to_local,
    save_document_record,
    get_document_record,
    save_cached_analysis,
    get_cached_analysis,
    create_session_id,
    delete_document_and_cache,
    UPLOAD_DIR
)
from services.ocr_service import extract_document
from services.rag_service import retrieve_relevant_laws
from services.gemini_service import analyze_document_with_gemini, generate_chat_response, stream_chat_response
from models.schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

api_router = APIRouter()
graph_builder = LegalKnowledgeGraphBuilder()

# ---------------------------------------------------------------------------
# Rate limiter — keyed by client IP.
# Override defaults via env vars:
#   RATE_LIMIT_ANALYZE  (default: 10/minute)  heavy Gemini + OCR call
#   RATE_LIMIT_CHAT     (default: 30/minute)  streaming chat call
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT_ANALYZE = os.getenv("RATE_LIMIT_ANALYZE", "10/minute")
RATE_LIMIT_CHAT    = os.getenv("RATE_LIMIT_CHAT",    "30/minute")

# Upload validation constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'docx'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}


class DocumentGenerationRequest(BaseModel):
    effective_date: str
    party_one_name: str
    party_two_name: str
    consideration_amount: str
    jurisdiction: str


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

        filename = file.filename
        if not filename:
            raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename.")
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format or MIME type. Only PDF, PNG, JPG, and JPEG are allowed."
            )

        doc_id = str(uuid.uuid4())
        local_path = os.path.join(UPLOAD_DIR, f"{doc_id}.{ext}")

        size = 0
        try:
            with open(local_path, "wb") as buffer:
                while chunk := await file.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_FILE_SIZE:
                        raise HTTPException(
                            status_code=413,
                            detail="File size exceeds the maximum allowed limit of 10MB."
                        )
                    buffer.write(chunk)
        except HTTPException as http_exc:
            if os.path.exists(local_path):
                os.remove(local_path)
            raise http_exc
        except Exception as e:
            if os.path.exists(local_path):
                os.remove(local_path)
            raise HTTPException(status_code=500, detail=f"File save failed: {str(e)}")

        save_document_record(session_id, doc_id, filename, local_path)
        return {"documentId": doc_id, "message": "Uploaded successfully"}

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/analyze/{document_id}")
@limiter.limit(RATE_LIMIT_ANALYZE)
def analyze_document(request: Request, document_id: str, language: str = "en", force_ocr: bool = False, file: UploadFile = File(None)):
    """Trigger full analysis pipeline."""
    try:
        session_id = require_session_id(request)
        record = require_document_owner(document_id, session_id)

        if not force_ocr:
            cached = get_cached_analysis(document_id, language)
            if cached:
                logger.info(f"Cache HIT for document {document_id}")
                knowledge_graph = graph_builder.generate_graph(cached["extracted_text"])
                return {
                    "documentId": document_id,
                    "analysis": cached["analysis"],
                    "knowledge_graph": knowledge_graph,
                    "extracted_text": cached["extracted_text"][:500] + "...",
                    "cached": True
                }

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
            contents = file.file.read()
            filename = file.filename

        text = extract_document(contents, filename, force_ocr=force_ocr, language=language)
        relevant_laws = retrieve_relevant_laws(text, k=3)
        analysis_result = analyze_document_with_gemini(text, relevant_laws, language)
        classification = classify_document(text)
        knowledge_graph = graph_builder.generate_graph(text)
        save_cached_analysis(document_id, language, text, analysis_result)

        return {
            "documentId": document_id,
            "analysis": analysis_result,
            "classification": classification,
            "knowledge_graph": knowledge_graph,
            "extracted_text": text[:500] + "...",
            "cached": False
        }

    except RateLimitExceeded:
        raise
    except HTTPException as http_err:
        raise http_err
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Requested document file not found on storage.")
    except Exception as e:
        from google.api_core.exceptions import ResourceExhausted, InvalidArgument, GoogleAPIError
        logger.error(f"Analysis failed: {e}")

        if isinstance(e, ResourceExhausted):
            raise HTTPException(status_code=429, detail="AI Quota limit reached. Please wait a minute and try again.")
        elif isinstance(e, InvalidArgument):
            raise HTTPException(status_code=400, detail="Invalid input structure. The document may be too long for the model.")
        elif isinstance(e, GoogleAPIError):
            raise HTTPException(status_code=502, detail="Upstream AI Service error. Please try again in a few moments.")

        if not os.getenv("GEMINI_API_KEY"):
            raise HTTPException(status_code=500, detail="Server configuration issue: GEMINI_API_KEY environment variable is missing.")

        if "fitz" in str(e.__class__) or "FileDataError" in type(e).__name__:
            raise HTTPException(status_code=400, detail="The uploaded document is corrupted or could not be parsed.")


@api_router.post("/chat/general")
@limiter.limit(RATE_LIMIT_CHAT)
def chat_general(request: Request, chat_request: ChatRequest):
    """General legal chat — no document context."""
    try:
        if not chat_request.user_message or not chat_request.user_message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        analysis = {}
        history = [{"role": msg.role, "message": msg.message} for msg in chat_request.chat_history]
        response_text = generate_chat_response(
            analysis,
            history,
            chat_request.user_message,
            chat_request.language
        )
        return ChatResponse(response=response_text)

    except RateLimitExceeded:
        raise
    except Exception as e:
        logger.error(f"General chat failed: {e}")
        raise HTTPException(status_code=500, detail="Chat generation failed")


@api_router.post("/chat/{document_id}")
@limiter.limit(RATE_LIMIT_CHAT)
def chat_with_document(request: Request, document_id: str, chat_request: ChatRequest):
    """Send chat message with document context loaded server-side."""
    try:
        session_id = require_session_id(request)
        require_document_owner(document_id, session_id)

        cached = get_cached_analysis(document_id, chat_request.language)
        analysis = cached["analysis"] if cached else {}

        history = [{"role": msg.role, "message": msg.message} for msg in chat_request.chat_history]
        generator = stream_chat_response(analysis, history, chat_request.user_message, chat_request.language)

        return StreamingResponse(generator, media_type="text/plain")

    except RateLimitExceeded:
        raise
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        logger.error(f"Chat failed for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Chat generation failed")


@api_router.post("/generate-document")
def generate_document(request: DocumentGenerationRequest):
    """Generates a standard NDA document as a PDF based on provided details."""
    try:
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(width / 2.0, height - 50, "NON-DISCLOSURE AGREEMENT")

        c.setFont("Helvetica", 12)
        text = c.beginText(50, height - 100)

        template_text = (
            f"This Non-Disclosure Agreement (the \"Agreement\") is entered into on {request.effective_date} "
            f"by and between {request.party_one_name} (\"Disclosing Party\") and {request.party_two_name} "
            f"(\"Receiving Party\").\n\n"
            f"1. Confidential Information: The Receiving Party agrees to keep confidential any proprietary "
            f"information disclosed by the Disclosing Party.\n\n"
            f"2. Consideration: In consideration for the obligations set forth herein, the parties acknowledge "
            f"the receipt and sufficiency of {request.consideration_amount}.\n\n"
            f"3. Jurisdiction: This Agreement shall be governed by the laws of {request.jurisdiction}.\n\n"
            f"IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written."
        )

        lines = template_text.split('\n')
        for line in lines:
            if not line:
                continue
            import textwrap
            wrapped_lines = textwrap.wrap(line, width=75)
            for wline in wrapped_lines:
                text.textLine(wline)
            text.textLine("")

        c.drawText(text)
        c.setFont("Helvetica-Oblique", 10)
        c.drawCentredString(width / 2.0, 30, "Generated by NyayaVanni - For informational purposes only.")

        c.showPage()
        c.save()
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="NDA_Document.pdf"'}
        )
    except Exception as e:
        logger.error(f"Failed to generate document: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate document")


@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, request: Request):
    session_id = require_session_id(request)
    require_document_owner(document_id, session_id)

    deleted = delete_document_and_cache(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"documentId": document_id, "deleted": True}
