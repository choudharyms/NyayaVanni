# FAQ.md — NyayaVanni ⚖️

Frequently asked questions from users and contributors in one place.

---

## Table of Contents

**Users**
1. [What is NyayaVanni?](#1-what-is-nyayavanni)
2. [What does "NyayaVanni" mean?](#2-what-does-nyayavanni-mean)
3. [What file types are supported for analysis?](#3-what-file-types-are-supported-for-analysis)
4. [Is my document data stored anywhere?](#4-is-my-document-data-stored-anywhere)
5. [Why is OCR not working on my document?](#5-why-is-ocr-not-working-on-my-document)
6. [Can NyayaVanni replace a lawyer?](#6-can-nyayavanni-replace-a-lawyer)
7. [How do I report a bug or security vulnerability?](#7-how-do-i-report-a-bug-or-security-vulnerability)

**Contributors**
8. [How do I run the project locally?](#8-how-do-i-run-the-project-locally)
9. [How do I get a Gemini API key?](#9-how-do-i-get-a-gemini-api-key)
10. [How do I contribute as a first-time contributor?](#10-how-do-i-contribute-as-a-first-time-contributor)
11. [What is the branch naming convention?](#11-what-is-the-branch-naming-convention)
12. [How do I run the tests?](#12-how-do-i-run-the-tests)

---

## Users

### 1. What is NyayaVanni?

NyayaVanni is an AI-powered legal document intelligence platform. You can upload contracts, notices, agreements, or scanned legal files and receive intelligent insights including document type detection, key party identification, clause extraction, risk assessment, and simplified legal summaries — all powered by Gemini AI.

---

### 2. What does "NyayaVanni" mean?

"Nyaya" (न्याय) means **justice** in Sanskrit, and "Vanni" means **voice**. NyayaVanni is the voice of justice — making complex legal documents understandable for everyone.

---

### 3. What file types are supported for analysis?

NyayaVanni supports the following formats:

| Format | Type |
|--------|------|
| PDF | Text-based and scanned |
| PNG | Image |
| JPG / JPEG | Image |
| DOCX | Word documents |

Scanned PDFs and images are processed using Tesseract OCR before AI analysis.

---

### 4. Is my document data stored anywhere?

Uploaded documents are processed in memory for analysis. The FAISS vector index used for AI chat is **in-memory only** and resets every time the backend restarts — meaning your document data is not permanently stored on any server.

> ⚠️ As a precaution, avoid uploading confidential government or legally sensitive records. NyayaVanni is intended for educational and informational use only.

---

### 5. Why is OCR not working on my document?

Common reasons OCR may fail:

- **Tesseract is not installed** — Install it and add it to your system PATH. See the [README](./README.md#-troubleshooting) for platform-specific instructions.
- **Low-quality scan** — Very blurry or low-resolution images may not extract well. Try scanning at a higher DPI (300+ recommended).
- **Corrupted file** — Re-export or re-scan the document and try again.
- **Unsupported format** — Only PDF, PNG, JPG, and JPEG are supported.

If OCR fails, the backend will return a clean error response instead of generating fake legal analysis:

```json
{
  "status": "ocr_failed",
  "message": "Unable to extract readable text from the document."
}
```

---

### 6. Can NyayaVanni replace a lawyer?

**No.** NyayaVanni provides AI-generated legal assistance for **educational and informational purposes only**. It does not replace:

- Professional legal consultation
- Certified legal advice
- Court-approved legal interpretation

Always consult a qualified legal professional for official legal decisions.

---

### 7. How do I report a bug or security vulnerability?

**For bugs:** Open an issue on GitHub with a clear title, steps to reproduce, and expected vs actual behaviour.

**For security vulnerabilities:** Do **not** open a public issue. Follow the responsible disclosure process described in [SECURITY.md](./SECURITY.md).

---

## Contributors

### 8. How do I run the project locally?

**Backend:**

```bash
git clone https://github.com/choudharyms/NyayaVanni.git
cd NyayaVanni/backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
# Create backend/.env and add your GEMINI_API_KEY
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`

**Frontend:**

```bash
cd frontend
npm install
# Create frontend/.env with VITE_API_URL=http://127.0.0.1:8000
npm run dev
```

Frontend runs at `http://localhost:5173`

For a detailed setup guide including Tesseract installation and environment variables, see [DEVELOPMENT.md](./DEVELOPMENT.md).

---

### 9. How do I get a Gemini API key?

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Copy the key and add it to `backend/.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

> The free tier of Gemini API is sufficient for local development and testing.

---

### 10. How do I contribute as a first-time contributor?

1. Browse [open issues](https://github.com/choudharyms/NyayaVanni/issues) and find one labelled `good first issue` or comment asking to be assigned
2. Fork the repository and clone your fork
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/choudharyms/NyayaVanni.git
   ```
4. Create a branch following the naming convention (see below)
5. Make your changes and test locally
6. Push and open a Pull Request linking the issue with `Closes #issue-number`

For the full workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

### 11. What is the branch naming convention?

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/feature-name` | `feat/add-voice-assistant` |
| Bug Fix | `fix/bug-description` | `fix/ocr-timeout-error` |
| Documentation | `docs/topic-name` | `docs/add-faq` |

Never commit directly to `main`.

---

### 12. How do I run the tests?

From the **project root** (not inside `backend/`):

```bash
pytest -q
```

Tests use `monkeypatch` to mock Gemini API calls — no real API key is needed to run them. For a full guide on running, writing, and structuring tests, see [TESTING.md](./TESTING.md).

---

*For setup details see [DEVELOPMENT.md](./DEVELOPMENT.md) · For contribution workflow see [CONTRIBUTING.md](./CONTRIBUTING.md) · For security see [SECURITY.md](./SECURITY.md)*
