from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import StreamingResponse
from services.storage_service import (
    upload_to_local, save_document_record, get_document_record,
    save_cached_analysis, get_cached_analysis
)
from services.ocr_service import extract_document
from services.rag_service import retrieve_relevant_laws
from services.gemini_service import analyze_document_with_gemini, generate_chat_response, stream_chat_response
from models.schemas import ChatRequest, ChatResponse, DocumentGenerationRequest
import json
import logging
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
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


@api_router.post("/chat/general")
async def chat_general(request: ChatRequest):
    """General legal chat — no document context."""
    try:
        history = [{"role": msg.role, "message": msg.message} for msg in request.chat_history]
        return StreamingResponse(
            stream_chat_response({}, history, request.user_message, request.language),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"General chat failed: {e}")
        raise HTTPException(status_code=500, detail="Chat generation failed")


@api_router.post("/chat/{document_id}")
async def chat_with_document(document_id: str, request: ChatRequest):
    """Send chat message with document context loaded server-side."""
    try:
        cached = get_cached_analysis(document_id, request.language)
        analysis = cached["analysis"] if cached else {}

        history = [{"role": msg.role, "message": msg.message} for msg in request.chat_history]
        return StreamingResponse(
            stream_chat_response(analysis, history, request.user_message, request.language),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Chat failed for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Chat generation failed")


@api_router.post("/generate-document")
async def generate_document(request: DocumentGenerationRequest):
    """Generates a standard NDA document as a PDF based on provided details."""
    try:
        # Create an in-memory byte stream to save the PDF
        buffer = io.BytesIO()
        
        # Setup reportlab canvas
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Document Title
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(width / 2.0, height - 50, "NON-DISCLOSURE AGREEMENT")
        
        # Body text
        c.setFont("Helvetica", 12)
        text = c.beginText(50, height - 100)
        
        # Standard NDA template text populated with variables
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
        
        # Split text into lines for the PDF to handle simple word wrap
        # Note: Reportlab's basic beginText doesn't auto-wrap, doing a rudimentary wrap or split by newline
        lines = template_text.split('\n')
        for line in lines:
            if not line:
                continue
            # Very basic wrap (assuming ~80 chars per line for 12pt Helvetica)
            import textwrap
            wrapped_lines = textwrap.wrap(line, width=75)
            for wline in wrapped_lines:
                text.textLine(wline)
            text.textLine("") # Add a blank line for paragraph spacing

        c.drawText(text)
        
        # Footer
        c.setFont("Helvetica-Oblique", 10)
        c.drawCentredString(width / 2.0, 30, "Generated by NyayaVanni - For informational purposes only.")
        
        # Finalize the PDF
        c.showPage()
        c.save()
        
        # Get the value from the buffer
        buffer.seek(0)
        
        return StreamingResponse(
            buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": 'attachment; filename="NDA_Document.pdf"'}
        )
    except Exception as e:
        logger.error(f"Failed to generate document: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate document")
