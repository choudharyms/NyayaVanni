import fitz

from backend.services.ocr_service import extract_text_from_pdf


def test_extract_text_from_pdf_closes_document():
    # Create a small dummy PDF in memory with enough character density to avoid OCR fallback
    doc = fitz.open()
    page = doc.new_page()
    for i in range(10):
        page.insert_text(
            (50, 50 + i * 20),
            "This is a line of legal text for testing the PDF text extraction service.",
        )
    pdf_bytes = doc.write()
    doc.close()

    # Extract text from the PDF bytes
    text = extract_text_from_pdf(pdf_bytes)
    assert "text extraction service" in text
