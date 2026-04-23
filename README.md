# NyayaVanni ⚖️

NyayaVanni is a modern legal document assistant designed to help users understand complex legal documents easily. It leverages AI to provide document analysis, key clause extraction, risk assessment, and an interactive chat interface for questioning specific legal texts.

## 🚀 Features

- **Document Analysis**: Automatically identify document type, parties involved, and key dates.
- **Clause Extraction**: Extract and summarize important clauses.
- **Risk Assessment**: Get a high-level overview of potential risks and recommended actions.
- **Smart Chat**: Ask questions directly to your legal documents using advanced AI.
- **OCR Support**: Analyze both text-based PDFs and scanned images/PDFs.

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI
- **AI**: Google Generative AI (Gemini)
- **Vector DB**: FAISS
- **OCR/Text Extraction**: PyMuPDF (fitz), Tesseract OCR, Pillow
- **Environment**: Python 3.x

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API Client**: Axios

## 📦 Project Structure

```text
NyayaVanni/
├── backend/        # FastAPI server and AI logic
├── frontend/       # React application
├── designs/        # UI/UX design assets
└── README.md       # Root documentation
```

## ⚙️ Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your `GOOGLE_API_KEY` and other necessary configurations.
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Set `VITE_API_URL` to your backend address (e.g., `http://localhost:8000`).
4. Run the development server:
   ```bash
   npm run dev
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
