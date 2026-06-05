# Changelog

All notable changes to **NyayaVanni** will be documented in this file.

This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- `CHANGELOG.md` to track all notable changes across versions

---

## [1.3.0] - 2026-05-31

### Added
- OCR verification UI for scanned document analysis
- Multilingual support for document processing and chat
- Native support for analyzing Word Documents (`.docx`)
- AI-powered deterministic document classification
- Version Diff Analyzer feature for comparing document versions
- Fallback `HTTPException` handler for unexpected errors in `analyze_document`
- `SECURITY.md` for responsible vulnerability reporting
- `CODE_OF_CONDUCT.md` for community guidelines
- CI pipeline with hardened pytest discovery and test coverage

### Changed
- Refactored Gemini AI integration for improved structure and reliability
- Refactored Tailwind CSS class readability in ScamDetection and Dashboard components
- Enhanced contributing guide and preserved core contributor credits
- Upgraded PDF document generator layout engine with payload validation
- Updated README with screenshots, project structure, and setup documentation

### Fixed
- Chat error handling and Gemini API validation improvements
- Dark mode text styling in consultation textarea
- Footer email overflow on responsive/mobile layouts
- Theme issue and general UI improvements

### Security
- Added centralized API rate limiting middleware
- Added per-IP rate limiting on Gemini AI endpoints to prevent API cost exhaustion
- Added file type, size, and magic-byte validation to document upload endpoint
- Secured `/chat/general` endpoint against unauthenticated API quota abuse
- Prevented Denial of Service (Zip Bomb) attack during Word document analysis
- Prevented application OOM via unbounded JSON payload protection
- Secured backend against storage exhaustion (DoS) with rate limiting
- Secured session management to mitigate XSS session hijacking

---

## [1.2.0] - 2026-05-21

### Added
- Smart Chat interface — ask questions directly to uploaded legal documents
- OCR support for scanned images and image-based PDFs using Tesseract OCR and Pillow
- Risk assessment overview with recommended actions
- FAISS vector database integration for document querying

### Changed
- Improved Tailwind CSS structure across frontend components
- Enhanced frontend environment variable configuration via `.env.example`

### Fixed
- Various UI alignment and responsiveness fixes across pages

---

## [1.1.0] - 2026-04-30

### Added
- Clause extraction — summarize important clauses from legal documents
- Document analysis — identify document type, parties involved, and key dates
- Multilingual document processing support (`main.py`)
- Backend environment variable support via `.env.example`

### Changed
- Restructured backend with FastAPI and Google Generative AI (Gemini) integration
- Improved project structure separating `backend/`, `frontend/`, and `designs/`

---

## [1.0.0] - 2026-03-01

### Added
- Initial MVP release of NyayaVanni ⚖️
- Legal document assistant powered by AI
- React 19 + Vite frontend with Tailwind CSS and Lucide React icons
- FastAPI backend with PyMuPDF (`fitz`) for PDF text extraction
- Google Generative AI (Gemini) integration for document intelligence
- Axios-based API client connecting frontend to backend
- Vercel deployment configuration for frontend
- MIT License
- Root `README.md` with setup instructions and project overview
- UI/UX design assets in `designs/` directory

---

[Unreleased]: https://github.com/choudharyms/NyayaVanni/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/choudharyms/NyayaVanni/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/choudharyms/NyayaVanni/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/choudharyms/NyayaVanni/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/choudharyms/NyayaVanni/releases/tag/v1.0.0
