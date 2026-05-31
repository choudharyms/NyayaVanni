import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os
import re
import logging
import docx

logger = logging.getLogger(__name__)

# Tesseract needs to be installed on the system
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


def is_invalid_extracted_text(text: str) -> bool:
    """
    Validate OCR extracted text before AI analysis.
    Prevent hallucinated AI analysis on invalid OCR.
    """

    if not text:
        return True

    cleaned = text.strip()

    # Very short text = likely OCR failure
    if len(cleaned) < 50:
        return True

    # Detect OCR failure messages
    blocked_patterns = [
        "OCR software is not installed",
        "OCR fallback failed",
        "Unable to extract",
        "unsupported format",
        "System cannot perform forced OCR",
        "System cannot read image text"
    ]

    for pattern in blocked_patterns:
        if pattern.lower() in cleaned.lower():
            return True

    # Detect heavily garbled OCR text
    special_chars = len(re.findall(r'[^a-zA-Z0-9\s]', cleaned))

    if len(cleaned) > 0 and (special_chars / len(cleaned)) > 0.40:
        return True

    return False


def preprocess_image_for_ocr(img: Image.Image) -> Image.Image:
    """
    Improve image quality before OCR.
    """

    # Convert to grayscale
    img = img.convert("L")

    # Resize for better OCR accuracy
    img = img.resize((img.width * 2, img.height * 2))

    # Apply thresholding
    img = img.point(lambda x: 0 if x < 140 else 255, '1')

    return img


def extract_text_from_pdf(pdf_bytes: bytes, force_ocr: bool = False, language: str = "en") -> str:
    """
    Extract text from PDF using PyMuPDF with OCR fallback.
    """

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    # Forced OCR mode
    if force_ocr:
        try:
            return extract_text_with_ocr_from_pdf(pdf_bytes, language=language)

        except Exception as e:
            logger.error(f"Forced OCR extraction failed: {e}")

            if getattr(e, "__class__", None) and "TesseractNotFoundError" in e.__class__.__name__:
                return "[Error: OCR software is not installed. System cannot perform forced OCR.]"

            raise

    # Direct text extraction
    text = ""

    for page in doc:
        text += page.get_text()

    # Detect scanned PDF
    page_count = len(doc)

    if page_count > 0:
        char_density = len(text.strip()) / page_count
        is_scanned = char_density < 150
    else:
        is_scanned = True

    # OCR fallback for scanned PDFs
    if is_scanned:
        try:
            ocr_text = extract_text_with_ocr_from_pdf(pdf_bytes, language=language)

            # Use OCR result only if valid
            if not is_invalid_extracted_text(ocr_text):
                return ocr_text

            logger.warning("OCR extracted unreadable text from scanned PDF.")

            return ""

        except Exception as e:
            logger.error(f"OCR fallback failed: {e}")

            if getattr(e, "__class__", None) and "TesseractNotFoundError" in e.__class__.__name__:
                return ""

            return ""

    return text.strip()


def extract_text_with_ocr_from_pdf(pdf_bytes: bytes, language: str = "en") -> str:
    """
    Extract text from scanned PDFs using OCR.
    """

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    text = ""
    
    tesseract_lang = "hin+eng" if language == "hi" else "eng"

    for page in doc:
        pix = page.get_pixmap()

        img_bytes = pix.tobytes("png")

        img = Image.open(io.BytesIO(img_bytes))

        # Improve OCR quality
        img = preprocess_image_for_ocr(img)

        page_text = pytesseract.image_to_string(img, lang=tesseract_lang)

        text += page_text + "\n"

    return text.strip()


def extract_text_from_image(image_bytes: bytes, language: str = "en") -> str:
    """
    Extract text from image using OCR.
    """

    try:
        img = Image.open(io.BytesIO(image_bytes))

        # Improve OCR quality
        img = preprocess_image_for_ocr(img)

        tesseract_lang = "hin+eng" if language == "hi" else "eng"
        text = pytesseract.image_to_string(img, lang=tesseract_lang)

        # Validate OCR output
        if is_invalid_extracted_text(text):
            raise ValueError(
                "Unable to extract readable text from the uploaded image."
            )

        return text

    except Exception as e:

        if getattr(e, "__class__", None) and "TesseractNotFoundError" in e.__class__.__name__:
            return "[Error: OCR software is not installed. System cannot read image text.]"

        if getattr(e, "__class__", None) and "UnidentifiedImageError" in e.__class__.__name__:
            raise ValueError(
                "The uploaded image is corrupted or in an unsupported format."
            )

        raise


def validate_docx_zip_bomb(file_bytes: bytes, max_uncompressed_size_mb: int = 50):
    """
    Prevent Denial of Service (Zip Bomb) by checking the uncompressed
    size of the DOCX archive before parsing it with python-docx.
    """
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
            total_uncompressed_size = sum(info.file_size for info in zf.infolist())
            max_bytes = max_uncompressed_size_mb * 1024 * 1024
            
            if total_uncompressed_size > max_bytes:
                logger.error(f"Zip bomb detected! Uncompressed size: {total_uncompressed_size} bytes")
                raise ValueError("Security check failed: Document uncompressed size exceeds safe limits (Zip Bomb protection).")
    except zipfile.BadZipFile:
        raise ValueError("The uploaded Word document is corrupted or invalid.")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Securely extract text from a Word Document.
    """
    validate_docx_zip_bomb(file_bytes)
    
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        logger.error(f"DOCX extraction failed: {e}")
        raise ValueError("Failed to read text from the Word document.")

def extract_document(
    file_bytes: bytes,
    filename: str,
    force_ocr: bool = False,
    language: str = "en"
) -> str:
    """
    Main router for text extraction based on file extension.
    """

    ext = filename.lower().split('.')[-1]

    # PDF
    if ext == 'pdf':

        extracted_text = extract_text_from_pdf(
            file_bytes,
            force_ocr=force_ocr,
            language=language
        )

    # Images
    elif ext in ['jpg', 'jpeg', 'png', 'tiff', 'bmp']:

        extracted_text = extract_text_from_image(file_bytes, language=language)

    # DOCX
    elif ext == 'docx':

        extracted_text = extract_text_from_docx(file_bytes)

    else:
        raise ValueError(f"Unsupported file format: {ext}")

    # Final validation before AI pipeline
    if is_invalid_extracted_text(extracted_text):

        logger.warning(
            "OCR extraction failed or produced unreadable text."
        )

        raise ValueError(
            "Unable to extract readable text from the document. "
            "Please upload a clearer PDF, DOCX, or image."
        )

    return extracted_text