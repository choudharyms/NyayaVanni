# GLOSSARY.md — NyayaVanni ⚖️

A reference guide to technical and legal terms used throughout the NyayaVanni project. Written in simple language for contributors and users of all backgrounds.

---

## Table of Contents

- [Project Terms](#project-terms)
- [AI & Machine Learning](#ai--machine-learning)
- [Backend & Infrastructure](#backend--infrastructure)
- [Legal Domain Terms](#legal-domain-terms)

---

## Project Terms

### NyayaVanni
**"Nyaya"** (न्याय) means **justice** in Sanskrit. **"Vanni"** means **voice**. Together, NyayaVanni means *the voice of justice* — an AI platform that makes complex legal documents understandable for everyone.

---

### Document Analysis
The process NyayaVanni uses to read an uploaded legal document and extract meaningful information from it — such as the document type, involved parties, key dates, clauses, risks, and recommended actions.

---

### Risk Assessment
An automated evaluation of a legal document that identifies potentially dangerous or unfavourable clauses — such as penalty conditions, financial liabilities, or one-sided obligations. NyayaVanni assigns a risk level (Low / Medium / High) and explains what it means in plain language.

---

### Clause Extraction
The process of identifying and isolating specific legal provisions within a document — such as payment clauses, termination clauses, arbitration clauses, or liability clauses — so they can be analysed individually.

---

### OCR (Optical Character Recognition)
A technology that reads text from images or scanned documents. When you upload a scanned PDF or an image of a legal document, NyayaVanni uses **Tesseract OCR** to extract the text before passing it to the AI for analysis.

Without OCR, scanned documents would be unreadable — they are images, not text files.

---

### OCR Failure Protection
A safety mechanism in NyayaVanni that stops AI analysis if OCR fails to extract readable text. This prevents the AI from generating fake or hallucinated legal analysis on a blank or corrupted input.

---

## AI & Machine Learning

### LLM (Large Language Model)
A type of AI model trained on massive amounts of text data that can understand and generate human language. NyayaVanni uses **Gemini** (Google's LLM) to read legal documents and produce summaries, risk assessments, and answers to questions.

---

### Gemini API
Google's AI API that provides access to the Gemini large language model. NyayaVanni sends document text to the Gemini API and receives structured legal analysis in return. You need a `GEMINI_API_KEY` to use it — see [FAQ.md](./FAQ.md#9-how-do-i-get-a-gemini-api-key) for how to get one.

---

### RAG (Retrieval-Augmented Generation)
A technique that improves AI responses by first **retrieving** relevant pieces of a document from a vector database, then **generating** an answer based only on those relevant pieces — rather than relying on the AI's general training data alone.

In NyayaVanni, RAG powers the AI chat feature. When you ask "What is the termination clause?", the system retrieves the relevant section from your document and passes it to Gemini to generate a focused answer.

---

### Embeddings
A way of converting text into a list of numbers (a vector) that captures the **meaning** of the text. Similar sentences produce similar vectors. NyayaVanni converts document chunks into embeddings so they can be searched by meaning — not just by keyword matching.

---

### Vector Database
A database that stores embeddings (numerical representations of text) and allows fast similarity search — finding the most relevant chunks of a document for a given question. NyayaVanni uses **FAISS** as its vector database.

---

### FAISS (Facebook AI Similarity Search)
An open-source library by Meta (Facebook) that enables fast similarity search over large collections of vectors (embeddings). In NyayaVanni, FAISS stores the embeddings of your uploaded document so the AI can quickly find the most relevant sections when you ask a question.

> **Note:** NyayaVanni's FAISS index is **in-memory only** — it resets every time the backend restarts. Your document data is not permanently stored.

---

### Hallucination
When an AI model generates information that sounds plausible but is factually incorrect or completely made up. NyayaVanni's OCR failure protection is specifically designed to prevent hallucinations — if the document text cannot be extracted, the AI will not attempt to analyse it.

---

### Monkeypatching
A testing technique where a function or module is temporarily replaced with a fake version during a test. NyayaVanni's tests use `monkeypatch` to replace Gemini API calls with mock responses so tests can run in CI without a real API key.

---

## Backend & Infrastructure

### FastAPI
A modern Python web framework used to build NyayaVanni's backend API. It is fast, automatically generates API documentation, and uses Python type hints for request/response validation via Pydantic.

---

### Uvicorn
An ASGI web server used to run the FastAPI application. When you run `uvicorn main:app --reload`, Uvicorn starts the NyayaVanni backend and automatically reloads it when you make code changes.

---

### Pydantic
A Python library used by FastAPI for data validation. It checks that incoming API requests have the correct fields and data types — and automatically returns a `422 Unprocessable Entity` error if they don't.

---

### PyMuPDF / fitz
A Python library used to extract text from PDF files. `fitz` is the import name for PyMuPDF. NyayaVanni uses it to read text-based PDFs before passing the content to the AI.

---

### Tesseract OCR
An open-source OCR engine originally developed by HP and now maintained by Google. NyayaVanni uses Tesseract to extract text from scanned PDFs and images. It must be installed separately on your system — see [DEVELOPMENT.md](./DEVELOPMENT.md) for installation instructions.

---

### Pillow
A Python image processing library. NyayaVanni uses Pillow to preprocess images (resize, convert, enhance) before passing them to Tesseract OCR, improving text extraction accuracy on low-quality scans.

---

### python-docx / docx
A Python library for reading and writing Microsoft Word (`.docx`) files. NyayaVanni uses it to extract text from uploaded Word documents. The package is installed as `python-docx` but imported in code as `import docx`.

---

### CORS (Cross-Origin Resource Sharing)
A browser security policy that controls which domains can make requests to an API. NyayaVanni's FastAPI backend is configured with CORS rules to allow the React frontend (running on `localhost:5173`) to communicate with it during local development.

---

### Virtual Environment (venv)
An isolated Python environment that keeps NyayaVanni's dependencies separate from other Python projects on your machine. Always activate the virtual environment before running or testing the backend.

```bash
# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

---

### pytest
The testing framework used for NyayaVanni's backend tests. It discovers and runs all test files matching the `test_*.py` pattern in the `tests/` directory. See [TESTING.md](./TESTING.md) for full usage instructions.

---

### conftest.py
A special pytest file that provides shared configuration and fixtures to all test files in the same directory. NyayaVanni's `conftest.py` sets up the `sys.path` so imports resolve correctly, and provides a `TestClient` fixture used by all endpoint tests.

---

## Legal Domain Terms

### Legal Notice
A formal written communication informing a party of a legal matter — such as a breach of contract, a demand for payment, or intent to take legal action. NyayaVanni can analyse legal notices and summarise what they mean and what action is required.

---

### Contract / Agreement
A legally binding document between two or more parties that outlines rights, obligations, and terms. NyayaVanni supports analysis of contracts and agreements to identify key clauses and risks.

---

### Arbitration Clause
A provision in a contract that requires disputes to be resolved through arbitration (a private process) rather than through the court system. NyayaVanni flags arbitration clauses during clause extraction.

---

### Termination Clause
A section of a contract that specifies the conditions under which the agreement can be ended by either party. Understanding termination clauses is important for knowing your rights if a contract goes wrong.

---

### Liability Clause
A section that defines which party is responsible for damages or losses if something goes wrong. NyayaVanni's risk assessment specifically looks for unfavourable liability clauses.

---

*For setup instructions see [DEVELOPMENT.md](./DEVELOPMENT.md) · For common questions see [FAQ.md](./FAQ.md) · For testing see [TESTING.md](./TESTING.md)*
