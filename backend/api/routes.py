"""
backend/api/routes.py  — PATCHED

Changes vs. original
--------------------
1.  Import `validate_upload` from the new `file_validator` module.
2.  Call `await validate_upload(file)` at the very top of the upload
    endpoint, *before* any disk I/O or OCR processing.
3.  Use the returned `content` bytes directly instead of re-reading the
    UploadFile (avoids a second seek).

All other logic (OCR, AI analysis, chat) is untouched.

Lines marked  # <<< NEW  were added by this patch.
Lines marked  # <<< CHANGED  were modified by this patch.
"""

import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

# <<< NEW — import the validation helper
from api.file_validator import validate_upload  # <<< NEW

# Existing imports (keep as-is)
from services.document_service import DocumentService
from services.ocr_service import extract_text_from_file

limiter = Limiter(key_func=get_remote_address)
api_router = APIRouter()
document_service = DocumentService()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Upload endpoint — PATCHED
# ---------------------------------------------------------------------------

@api_router.post("/upload", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def upload_document(file: UploadFile = File(...)):
    """
    Accept a legal document (PDF / PNG / JPEG), run OCR, and persist it.

    Validation order
    ----------------
    1. File size  ≤ 10 MB              → 413 if exceeded
    2. Declared Content-Type allowed   → 415 if not PDF/PNG/JPEG
    3. Magic-byte match                → 415 if bytes ≠ declared type
    4. Proceed with OCR + storage
    """

    # ------------------------------------------------------------------ #
    # <<< NEW  Step 1-3: validate size, MIME type, and magic bytes        #
    # Raises HTTPException with a user-friendly message on any failure.   #
    # Returns the raw bytes so we do not need to re-read the stream.      #
    # ------------------------------------------------------------------ #
    content: bytes = await validate_upload(file)  # <<< NEW

    # ------------------------------------------------------------------ #
    # Original logic — save file to disk                                  #
    # ------------------------------------------------------------------ #
    file_id = str(uuid.uuid4())
    # Preserve the original extension for downstream processing
    original_ext = os.path.splitext(file.filename or "")[-1].lower() or ".bin"
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}{original_ext}")

    # <<< CHANGED — write `content` (already in memory) instead of
    # calling file.read() again (the stream is exhausted after validate_upload)
    with open(save_path, "wb") as f:
        f.write(content)  # <<< CHANGED (was: f.write(await file.read()))

    # ------------------------------------------------------------------ #
    # Original logic — OCR extraction                                     #
    # ------------------------------------------------------------------ #
    extracted_text = extract_text_from_file(save_path)

    if not extracted_text or len(extracted_text.strip()) < 20:
        # Remove the saved file; nothing useful to process
        os.remove(save_path)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": "ocr_failed",
                "message": "Unable to extract readable text from the document. "
                           "Please ensure the file is a clear, non-corrupted PDF or image.",
            },
        )

    # ------------------------------------------------------------------ #
    # Original logic — persist document metadata + build vector index     #
    # ------------------------------------------------------------------ #
    doc_metadata = document_service.save_document(
        file_id=file_id,
        filename=file.filename,
        file_path=save_path,
        extracted_text=extracted_text,
    )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "success",
            "document_id": file_id,
            "filename": file.filename,
            "message": "Document uploaded and processed successfully.",
            "metadata": doc_metadata,
        },
    )


# ---------------------------------------------------------------------------
# Remaining endpoints (analyze, chat, health) — UNCHANGED
# ---------------------------------------------------------------------------

@api_router.post("/analyze/{document_id}")
async def analyze_document(document_id: str):
    """Run AI legal analysis on a previously uploaded document."""
    result = document_service.analyze_document(document_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )
    return result


@api_router.post("/chat")
async def chat_with_document(payload: dict):
    """Answer a question about an uploaded document using RAG."""
    document_id = payload.get("document_id")
    question = payload.get("question", "").strip()

    if not document_id or not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both 'document_id' and 'question' are required.",
        )

    answer = document_service.chat(document_id, question)
    if answer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )
    return {"answer": answer}


@api_router.get("/health")
async def health_check():
    return {"status": "ok"}
