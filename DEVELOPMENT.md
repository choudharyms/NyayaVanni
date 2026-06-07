# DEVELOPMENT.md — NyayaVanni ⚖️

A comprehensive guide for contributors who want to set up the project locally, understand the codebase, and make meaningful contributions.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Setup — Backend](#2-local-setup--backend)
3. [Local Setup — Frontend](#3-local-setup--frontend)
4. [Project Architecture Overview](#4-project-architecture-overview)
5. [Folder Structure](#5-folder-structure)
6. [Frontend ↔ Backend Communication](#6-frontend--backend-communication)
7. [Common Debugging Tips & Known Issues](#7-common-debugging-tips--known-issues)
8. [Code Style & Conventions](#8-code-style--conventions)
9. [Running Linters & Formatters](#9-running-linters--formatters)

---

## 1. Prerequisites

Make sure the following tools are installed on your system before proceeding.

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Python | 3.9+ | Backend runtime |
| Node.js | 18+ | Frontend runtime (required by Vite 8) |
| npm | 9+ | Frontend package manager |
| Tesseract OCR | 4.x | OCR for scanned PDFs and images |
| Git | 2.x | Version control |

### Installing Tesseract OCR

Tesseract is a system-level dependency — it is **not** installed by `pip`. Install it separately before running the backend.

**Ubuntu / Debian:**
```bash
sudo apt-get install tesseract-ocr
```

**macOS (Homebrew):**
```bash
brew install tesseract
```

**Windows:**
Download the installer from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) and add its install directory to your system `PATH`.

Verify the installation:
```bash
tesseract --version
```

### Obtaining a Gemini API Key

NyayaVanni uses Google's Gemini models for all AI features. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) before starting the backend.

---

## 2. Local Setup — Backend

### Step 1 — Navigate to the backend directory

```bash
cd backend
```

### Step 2 — Create and activate a Python virtual environment

```bash
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows (Command Prompt)
venv\Scripts\activate

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
```

Your terminal prompt should show `(venv)` once activated.

### Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

The backend depends on the following packages (defined in `requirements.txt`):

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework and REST API |
| `uvicorn` | ASGI server |
| `google-generativeai` | Google Gemini AI integration |
| `faiss-cpu` | Vector similarity search (RAG) |
| `numpy` | Numerical operations for FAISS |
| `PyMuPDF` | Text extraction from PDFs |
| `pytesseract` | Python wrapper for Tesseract OCR |
| `Pillow` | Image processing for OCR |
| `python-multipart` | File upload support in FastAPI |
| `python-jose` | JWT handling |
| `passlib` | Password hashing utilities |
| `pydantic` / `pydantic-settings` | Data validation and settings management |
| `python-dotenv` | Loading `.env` variables |
| `gunicorn` | Production WSGI server |
| `reportlab` | PDF report generation |
| `slowapi` | Rate limiting middleware |

> **Tip:** If you encounter build errors on Linux for `Pillow` or `PyMuPDF`, install system-level image libraries first:
> ```bash
> sudo apt-get install libjpeg-dev zlib1g-dev
> ```

### Step 4 — Configure environment variables

```bash
cp .env.example .env
```

Open `backend/.env` and fill in the required values:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
```

`FRONTEND_URL` is used by the CORS middleware to allow requests from the React dev server. If you change the Vite port, update this value to match.

### Step 5 — Start the development server

```bash
uvicorn main:app --reload
```

Or run directly:
```bash
python main.py
```

The backend will be available at `http://localhost:8000`.

- Root health check: `GET http://localhost:8000/` → `{"message": "NyayaVanni Backend API is running."}`
- All feature routes are mounted under the `/api` prefix (e.g. `/api/...`).
- Interactive Swagger docs: `http://localhost:8000/docs`
- ReDoc alternative: `http://localhost:8000/redoc`

> **Note:** The backend enforces an **11 MB upload limit** via `LimitUploadSizeMiddleware`. Files larger than this will receive a `413 Payload Too Large` response.

---

## 3. Local Setup — Frontend

Open a **new terminal window** (keep the backend running).

### Step 1 — Navigate to the frontend directory

```bash
cd frontend
```

### Step 2 — Install dependencies

```bash
npm install
```

Key dependencies installed (from `package.json`):

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI library (v19) |
| `react-router-dom` | Client-side routing (v7) |
| `axios` | HTTP client for backend API calls |
| `tailwindcss` | Utility-first CSS framework (v4) |
| `lucide-react` | Icon library |
| `react-markdown` | Render Markdown in AI responses |
| `reactflow` | Node-based diagram rendering |
| `@tailwindcss/typography` | Prose styling for rendered markdown |

### Step 3 — Configure environment variables

```bash
cp .env.example .env
```

`frontend/.env` should contain:

```env
VITE_API_URL=http://localhost:8000
```

This is the only frontend environment variable. It is read at build time via `import.meta.env.VITE_API_URL`. Any Vite env variable must be prefixed with `VITE_` to be exposed to the browser bundle.

### Step 4 — Start the development server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite's default port).

Available npm scripts:

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `vite` | Start development server with HMR |
| `npm run build` | `vite build` | Production build to `dist/` |
| `npm run preview` | `vite preview` | Preview the production build locally |
| `npm run lint` | `eslint .` | Run ESLint across all source files |

---

## 4. Project Architecture Overview

NyayaVanni is a full-stack AI-powered legal document assistant. Here is how the pieces fit together:

```
┌────────────────────────────────────────────────┐
│                 User (Browser)                 │
│   React 19 + Vite + Tailwind CSS + Axios       │
│                                                │
│  pages/ ──► components/ ──► services/ (Axios) │
└───────────────────┬────────────────────────────┘
                    │  HTTP REST  (JSON / multipart)
                    ▼
┌────────────────────────────────────────────────┐
│           FastAPI Backend (main.py)            │
│                                                │
│  Middleware:                                   │
│   • LimitUploadSizeMiddleware  (11 MB cap)     │
│   • CORSMiddleware  (allows FRONTEND_URL)      │
│   • SlowAPI  (rate limiting)                   │
│                                                │
│  Routes (mounted at /api):                     │
│   └── api/routes.py  ──►  api_router           │
│                                                │
│  ┌──────────────┐    ┌────────────────────┐   │
│  │ Text Extract │    │  FAISS Vector Store │   │
│  │ PyMuPDF      │    │  (in-memory RAG)    │   │
│  │ + Tesseract  │    └──────────┬──────────┘   │
│  └──────┬───────┘               │              │
│         └──────────────┬────────┘              │
│                        ▼                       │
│              Google Gemini AI                  │
│         (analysis, extraction, chat)           │
└────────────────────────────────────────────────┘
```

### How each component contributes

**`main.py` (FastAPI entry point)** — Bootstraps the app, registers middleware (upload size cap, CORS, rate limiting), and mounts the API router at `/api`.

**`api/routes.py`** — Contains all feature route definitions, imported as `api_router` and included by `main.py`.

**PyMuPDF (`fitz`)** — Extracts text from text-based PDFs directly and efficiently.

**Tesseract OCR + Pillow** — Handles scanned PDFs and image files by rasterising pages and running OCR to produce readable text.

**FAISS** — Stores document text as vector embeddings in memory, enabling fast semantic similarity search. Used by the chat feature to retrieve the most relevant clauses before passing context to Gemini (RAG pattern).

**Google Generative AI (Gemini)** — The LLM powering document type detection, clause extraction, risk assessment, and the conversational Q&A interface.

**React 19 / Vite** — Component-based frontend. Vite provides near-instant hot module replacement (HMR) during development. Routing is handled by `react-router-dom` v7.

**`slowapi`** — Provides rate limiting on backend endpoints to prevent abuse.

---

## 5. Folder Structure

```
NyayaVanni/
│
├── backend/                    # FastAPI server and AI logic
│   ├── api/
│   │   └── routes.py           # All /api route definitions (api_router)
│   ├── main.py                 # App entry point; middleware + router registration
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Backend environment variable template
│   └── .env                    # Your local secrets (git-ignored)
│
├── frontend/                   # React application
│   ├── public/                 # Static assets served as-is
│   ├── src/
│   │   ├── assets/             # Images, fonts, and static resources
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # React Context providers (global state)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Top-level page components (one per route)
│   │   ├── utils/              # Helper functions and utilities
│   │   ├── App.css             # Global app styles
│   │   ├── App.jsx             # Root component; route definitions
│   │   ├── index.css           # Base/reset CSS (Tailwind directives)
│   │   └── main.jsx            # React entry point; mounts <App />
│   ├── index.html              # HTML shell for Vite
│   ├── package.json            # Dependencies and npm scripts
│   ├── vite.config.js          # Vite configuration
│   ├── postcss.config.js       # PostCSS config (Tailwind v4)
│   ├── eslint.config.js        # ESLint configuration
│   ├── .env.example            # Frontend environment variable template
│   └── .env                    # Your local config (git-ignored)
│
├── designs/                    # UI/UX mockups and design assets
│
├── .github/
│   └── ISSUE_TEMPLATE/         # GitHub issue templates
│
├── main.py                     # Root-level entry (references backend)
├── CONTRIBUTING.md             # Contribution workflow guidelines
├── DEVELOPMENT.md              # This file
├── LICENSE                     # MIT licence
└── README.md                   # Project overview and quick start
```

---

## 6. Frontend ↔ Backend Communication

All communication between React and FastAPI is over HTTP. Regular data is exchanged as JSON; file uploads use `multipart/form-data`.

### End-to-end request flow

1. The user uploads a PDF or image through the frontend UI.
2. The frontend sends a `POST` request (with the file as `multipart/form-data`) to a backend endpoint under `/api/`.
3. The backend extracts text using PyMuPDF (text PDFs) or Tesseract (scanned/image files).
4. Extracted text is embedded and stored in the in-memory FAISS index.
5. Gemini analyses the document and returns structured results (document type, key clauses, risk assessment).
6. The backend sends a JSON response; the frontend renders it in the UI.
7. For follow-up questions, the frontend posts to a chat endpoint. The backend performs a FAISS similarity search, retrieves relevant chunks, and passes them as context to Gemini before returning the answer.

### Environment variable reference

| Variable | File | Description |
|----------|------|-------------|
| `GEMINI_API_KEY` | `backend/.env` | Google Gemini API key (required) |
| `FRONTEND_URL` | `backend/.env` | Origin allowed by CORS middleware (default: `http://localhost:5173`) |
| `VITE_API_URL` | `frontend/.env` | Full URL of the running backend (default: `http://localhost:8000`) |

### CORS configuration

The backend's CORS middleware reads `FRONTEND_URL` from the environment:

```python
allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")]
```

If you run the frontend on a different port (e.g. after changing Vite config), update `FRONTEND_URL` in `backend/.env` accordingly, then restart the backend.

### Upload size limit

The backend enforces an **11 MB** ceiling on all incoming requests via `LimitUploadSizeMiddleware`. Uploads over this limit receive:

```json
{ "detail": "Payload Too Large: The request body exceeds the maximum allowed limit." }
```

with HTTP status `413`.

---

## 7. Common Debugging Tips & Known Issues

### Backend won't start — `ModuleNotFoundError`
The virtual environment is not activated. Your prompt must show `(venv)`. Re-run the activation command from [Step 2](#step-2--create-and-activate-a-python-virtual-environment), then retry `uvicorn main:app --reload`.

### `GEMINI_API_KEY` errors / `401 Unauthorized` from Gemini
- Confirm `backend/.env` exists (not the project root `.env`).
- Confirm the key is valid and not expired. Free-tier keys from Google AI Studio are rate-limited.

### Tesseract not found — `TesseractNotFoundError`
Tesseract is not installed or not on your `PATH`. Verify with `tesseract --version`. On Windows, confirm the Tesseract install directory (e.g. `C:\Program Files\Tesseract-OCR`) is in your system `PATH` environment variable.

### Frontend cannot reach the backend — CORS error in browser console
- Confirm the backend is running on port `8000`.
- Confirm `VITE_API_URL` in `frontend/.env` is `http://localhost:8000` (no trailing slash).
- Confirm `FRONTEND_URL` in `backend/.env` is `http://localhost:5173`.
- Restart both servers after any `.env` change.

### `npm install` peer dependency warnings
React 19 can cause peer conflict warnings with some packages. Use:
```bash
npm install --legacy-peer-deps
```

### FAISS index is empty after restarting the backend
The FAISS vector store is **in-memory only** — it is rebuilt fresh each time the backend starts. Re-upload your document after restarting the backend before using the chat feature.

### File upload rejected with 413
Your file exceeds the 11 MB limit enforced by `LimitUploadSizeMiddleware`. Compress or split the document before uploading.

### `python-jose` or `passlib` import errors
These are included in `requirements.txt` for authentication utilities. Ensure they installed correctly:
```bash
pip install python-jose passlib
```

---

## 8. Code Style & Conventions

### Python (Backend)

- Follow [PEP 8](https://peps.python.org/pep-0008/) for all Python code.
- Use **type hints** for all function parameters and return values.
- Use `async def` for all FastAPI route handlers to benefit from async I/O.
- Keep route handler functions focused — extract heavy logic into helper functions or service modules.
- Use descriptive route function names: `analyze_document`, `chat_with_document`, etc.
- Use `pydantic` models for all request bodies and response schemas.

### JavaScript / React (Frontend)

- Use **functional components** with React Hooks only — no class components.
- One component per file; filename matches the exported component name in PascalCase (e.g. `DocumentUpload.jsx`).
- Place all `axios` API calls inside `src/utils/` or a dedicated `src/services/` module — keep components free of direct HTTP calls.
- Use Tailwind CSS utility classes for all styling. Avoid writing custom CSS unless there is no Tailwind equivalent.
- Use `src/contexts/` for global shared state (React Context API).
- Use `src/hooks/` for any reusable stateful logic extracted from components.
- Prefer descriptive variable names over abbreviations.

### Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

Types:
  feat     – a new feature
  fix      – a bug fix
  docs     – documentation only changes
  refactor – code change that neither fixes a bug nor adds a feature
  style    – formatting, whitespace (no logic change)
  test     – adding or updating tests
  chore    – build process or tooling changes

Examples:
  feat: add risk assessment summary panel
  fix: handle empty PDF upload gracefully
  docs: add DEVELOPMENT.md with local setup guide
  refactor: extract OCR logic into helper module
```

---

## 9. Running Linters & Formatters

Run these before pushing your branch. Pull requests with lint errors may be asked for revisions.

### Backend — Python

**Format with Black:**
```bash
cd backend
pip install black
black .
```

**Lint with Flake8:**
```bash
pip install flake8
flake8 .
```

**Type-check with mypy (optional but recommended):**
```bash
pip install mypy
mypy .
```

### Frontend — JavaScript / React

**Lint with ESLint** (configured via `eslint.config.js`):
```bash
cd frontend
npm run lint
```

ESLint is pre-configured with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` via `devDependencies`.

**Format with Prettier** (if added to the project):
```bash
npx prettier --write "src/**/*.{js,jsx,css}"
```

---

For the full contribution workflow (branching, PRs, commit conventions), see [CONTRIBUTING.md](./CONTRIBUTING.md).
For a general project overview and quick-start, see [README.md](./README.md).
