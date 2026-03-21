import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os

# Tesseract needs to be installed on the system (e.g. windows exe or apt-get install tesseract-ocr)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from a digital PDF using PyMuPDF"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    
    # If the PDF is scanned (image-based), PyMuPDF won't extract the text directly
    # We fallback to OCR if length is suspiciously short
    if len(text.strip()) < 50:
        return extract_text_with_ocr_from_pdf(pdf_bytes)
        
    return text.strip()

def extract_text_with_ocr_from_pdf(pdf_bytes: bytes) -> str:
    """Use pytesseract to extract text from a scanned PDF"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        pix = page.get_pixmap()
        img_bytes = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_bytes))
        page_text = pytesseract.image_to_string(img)
        text += page_text + "\n"
    return text.strip()

def extract_text_from_image(image_bytes: bytes) -> str:
    """Use PyTesseract to extract text from an image"""
    img = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(img)

def extract_document(file_bytes: bytes, filename: str) -> str:
    """Main router for text extraction based on file extension"""
    ext = filename.lower().split('.')[-1]
    
    if ext == 'pdf':
        return extract_text_from_pdf(file_bytes)
    elif ext in ['jpg', 'jpeg', 'png', 'tiff', 'bmp']:
        return extract_text_from_image(file_bytes)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
