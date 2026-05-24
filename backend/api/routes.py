import os
import uuid
import json
import logging
import io

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter

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

# Upload validation constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
ALLOWED_MIME_TYPES = {'application/pdf', 'image/png', 'image/jpeg'}

class DocumentGenerationRequest(BaseModel):
    effective_date: str = Field(..., max_length=100)
    party_one_name: str = Field(..., max_length=500)
    party_two_name: str = Field(..., max_length=500)
    consideration_amount: str = Field(..., max_length=500)
    jurisdiction: str = Field(..., max_length=200)

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
            contents = file.file.read()
            filename = file.filename

        # 1. Extract Text
        text = extract_document(contents, filename, force_ocr=force_ocr, language=language)

        # 2. RAG Retrieval
        relevant_laws = retrieve_relevant_laws(text, k=3)

        # 3. Gemini Analysis
        analysis_result = analyze_document_with_gemini(
            text,
            relevant_laws,
            language
        )
        
        # 4. Classification
        classification = classify_document(text)

        # 5. Generate Knowledge Graph
        knowledge_graph = graph_builder.generate_graph(text)

        # 6. Save cache
        save_cached_analysis(
            document_id,
            language,
            text,
            analysis_result
        )

        return {
            "documentId": document_id,
            "analysis": analysis_result,
            "classification": classification,
            "knowledge_graph": knowledge_graph,
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
        from google.api_core.exceptions import (
            ResourceExhausted,
            InvalidArgument,
            GoogleAPIError
        )

        trace = traceback.format_exc()
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
def chat_general(request: ChatRequest):
    """General legal chat no document context."""
    try:
        if not request.user_message or not request.user_message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        # General chat does not use document-specific analysis context.
        analysis = {}
        history = [{"role": msg.role, "message": msg.message} for msg in request.chat_history]

        response_text = generate_chat_response(
            analysis,
            history,
            request.user_message,
            request.language
        )

        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"General chat failed: {e}")
        raise HTTPException(status_code=500, detail="Chat generation failed")

@api_router.post("/chat/{document_id}")
def chat_with_document(document_id: str, chat_request: ChatRequest, http_request: Request):
    """Send chat message with document context loaded server-side."""
    try:
        session_id = require_session_id(http_request)
        require_document_owner(document_id, session_id)
        
        cached = get_cached_analysis(document_id, chat_request.language)
        analysis = cached["analysis"] if cached else {}

        history = [{"role": msg.role, "message": msg.message} for msg in chat_request.chat_history]
        generator = stream_chat_response(analysis, history, chat_request.user_message, chat_request.language)

        return StreamingResponse(generator, media_type="text/plain")
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
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50
        )
        
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        elements.append(Paragraph("NON-DISCLOSURE AGREEMENT", styles['Title']))
        elements.append(Spacer(1, 24))
        
        # Introduction
        intro_text = (
            f"This Non-Disclosure Agreement (the \"Agreement\") is entered into on <b>{request.effective_date}</b> "
            f"by and between <b>{request.party_one_name}</b> (\"Disclosing Party\") and <b>{request.party_two_name}</b> "
            f"(\"Receiving Party\")."
        )
        elements.append(Paragraph(intro_text, styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Clauses
        clause_1 = (
            "<b>1. Confidential Information:</b> The Receiving Party agrees to keep confidential any proprietary "
            "information disclosed by the Disclosing Party."
        )
        elements.append(Paragraph(clause_1, styles['Normal']))
        elements.append(Spacer(1, 12))
        
        clause_2 = (
            f"<b>2. Consideration:</b> In consideration for the obligations set forth herein, the parties acknowledge "
            f"the receipt and sufficiency of <b>{request.consideration_amount}</b>."
        )
        elements.append(Paragraph(clause_2, styles['Normal']))
        elements.append(Spacer(1, 12))
        
        clause_3 = (
            f"<b>3. Jurisdiction:</b> This Agreement shall be governed by the laws of <b>{request.jurisdiction}</b>."
        )
        elements.append(Paragraph(clause_3, styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Conclusion
        conclusion = "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written."
        elements.append(Paragraph(conclusion, styles['Normal']))
        elements.append(Spacer(1, 48))
        
        # Footer Callback
        def add_footer(canvas, document):
            canvas.saveState()
            canvas.setFont('Helvetica-Oblique', 10)
            canvas.drawCentredString(letter[0] / 2.0, 30, "Generated by NyayaVanni - For informational purposes only.")
            canvas.restoreState()
            
        doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
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
