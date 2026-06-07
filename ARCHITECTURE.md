# Architecture Overview ⚖️

NyayaVanni is a full-stack AI-powered legal document intelligence platform built on a **React + FastAPI** architecture.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 + Vite | User interface |
| Styling | Tailwind CSS | Responsive design |
| HTTP Client | Axios | Frontend to Backend API calls |
| Backend | FastAPI (Python) | REST API server |
| AI Engine | Google Gemini AI | Legal analysis and chat |
| OCR | Tesseract + PyMuPDF | Text extraction from documents |
| Vector Search | FAISS | RAG-based document retrieval |

---

## 📂 Project Structure

NyayaVanni/
├── backend/
│   ├── api/routes.py              # All API route definitions
│   ├── models/schemas.py          # Pydantic request/response schemas
│   ├── services/
│   │   ├── gemini_service.py      # Gemini AI integration
│   │   ├── ocr_service.py         # OCR text extraction
│   │   ├── rag_service.py         # FAISS vector search
│   │   ├── legal_processor.py     # Document processing pipeline
│   │   ├── document_classifier.py # Legal document classification
│   │   └── storage_service.py     # File storage management
│   └── main.py                    # FastAPI app entry point
└── frontend/
    └── src/
        ├── components/            # Reusable UI components
        ├── pages/                 # Page-level route components
        ├── contexts/              # Global state (React Context)
        ├── hooks/                 # Custom React hooks
        └── utils/                 # Axios API clients
---

## 🔄 How React Communicates with FastAPI

React frontend and FastAPI backend are completely separate services.
They communicate exclusively via REST API over HTTP/JSON.

Request Flow:

User (Browser)
      |
      v
React Frontend (localhost:5173)
      |
      | HTTP Request via Axios
      | e.g. POST /api/upload
      |
      v
FastAPI Backend (localhost:8000)
      |
      |-- storage_service     → saves uploaded file
      |-- ocr_service         → extracts text from PDF/image
      |-- legal_processor     → processes document content
      |-- document_classifier → detects document type
      |-- gemini_service      → calls Gemini AI API
      |-- rag_service         → FAISS vector search for chat
      |
      | JSON Response
      | e.g. { "status": "ok", "summary": "..." }
      |
      v
React Frontend renders result to user

---

## 📡 Core API Routes

| Method | Endpoint | Request Format | Description |
|---|---|---|---|
| POST | /api/upload | multipart/form-data | Upload a legal document |
| POST | /api/analyze/{id} | application/json | Run AI analysis on document |
| POST | /api/chat | application/json | Chat with uploaded document |
| GET | /health | none | Backend health check |

---

## 🔍 Data Flow — Document Upload and Analysis

1. User uploads file via React UI
2. Axios sends POST /api/upload (multipart/form-data)
3. FastAPI: storage_service saves file and returns document ID
4. Axios sends POST /api/analyze/{id}
5. FastAPI pipeline runs:
   ocr_service extracts text
   legal_processor cleans and processes text
   document_classifier detects document type
   gemini_service generates summary and risk assessment
6. JSON response returned to React:
   { summary, risk_assessment, clauses, document_type }
7. React renders results on dashboard

---

## 💬 Data Flow — AI Chat

1. User types question in React chat UI
2. Axios sends POST /api/chat
   { "document_id": "...", "question": "What are my risks?" }
3. FastAPI: rag_service fetches relevant context via FAISS
4. gemini_service sends context + question to Gemini AI
5. JSON response returned:
   { "answer": "..." }
6. React displays answer in chat window

---

## 🔐 Security Design

- Gemini API key stored only in backend .env — never exposed to frontend
- All AI requests proxied through FastAPI — frontend has no direct AI access
- Uploaded files stored in backend/uploads/ and not publicly served

---

## ⚙️ Environment Configuration

Backend (backend/.env):
GEMINI_API_KEY=your_gemini_api_key

Frontend (frontend/.env):
VITE_API_URL=http://localhost:8000

The frontend uses VITE_API_URL as the base URL for all Axios requests.