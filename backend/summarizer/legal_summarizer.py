import google.generativeai as genai
import pdfplumber
from googletrans import Translator

genai.configure(api_key="YOUR_GEMINI_API_KEY")
model = genai.GenerativeModel("gemini-pro")
translator = Translator()

LANGUAGES = {
    "hindi": "hi",
    "tamil": "ta",
    "telugu": "te",
    "bengali": "bn",
    "marathi": "mr",
}


def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text


def summarize_legal_document(text):
    prompt = f"""
    You are a legal expert. Summarize the following legal document in simple, plain language.
    Also extract:
    1. Key parties involved
    2. Important dates
    3. Case numbers (if any)
    4. Key legal terms with brief explanations

    Document:
    {text}

    Respond in JSON format with keys: summary, parties, dates, case_numbers, legal_terms
    """
    response = model.generate_content(prompt)
    return response.text


def translate_summary(summary, language):
    lang_code = LANGUAGES.get(language.lower(), "hi")
    translated = translator.translate(summary, dest=lang_code)
    return translated.text
