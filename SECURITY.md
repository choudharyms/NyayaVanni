# 🔒 Security Policy

## Supported Versions

The following versions of NyayaVanni are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅ Supported        |
| Older   | ❌ Not Supported    |

We recommend always using the latest version of the project.

---

## 🚨 Reporting a Vulnerability

We take security vulnerabilities seriously. NyayaVanni handles sensitive legal documents, so security is our top priority.

Please do **NOT** open a public GitHub issue for security vulnerabilities as it may expose the issue to others before it is fixed.

Instead, please report it privately by opening a **GitHub Security Advisory**:

👉 [Report a Vulnerability](https://github.com/choudharyms/NyayaVanni/security/advisories/new)

Please include the following details in your report:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes (optional but appreciated)

---

## ⏱️ Security Response Process

Once a vulnerability is reported, here is what you can expect:

1. **Acknowledgement** — We will acknowledge receipt of your report within **48 hours**
2. **Investigation** — We will investigate and validate the reported vulnerability
3. **Fix** — We will work on a fix and keep you updated on progress
4. **Release** — A patched version will be released as soon as possible
5. **Credit** — With your permission, we will credit you for the responsible disclosure

---

## 🛡️ Security Best Practices for Contributors

When contributing to NyayaVanni, please follow these security guidelines:

- Never commit API keys, secrets, or credentials to the repository
- Always use `.env` files for sensitive environment variables like `GEMINI_API_KEY`
- Never expose uploaded legal documents or user data in logs
- Ensure all file uploads are validated before processing
- Follow the principle of least privilege when handling user data
- Never store sensitive legal document content in plaintext

---

## 🔐 Current Security Measures

NyayaVanni implements the following security measures:

- **Document Privacy** — Uploaded documents are processed securely and not shared
- **OCR Failure Protection** — AI analysis is stopped if OCR fails to prevent hallucinations
- **Environment Variables** — Sensitive keys like `GEMINI_API_KEY` are stored in `.env` files
- **Input Validation** — Only supported file formats (PDF, PNG, JPG, JPEG) are accepted
- **AI Disclaimer** — Users are informed that AI output is for educational purposes only

---

## ⚠️ Legal Document Disclaimer

NyayaVanni processes sensitive legal documents. Users are advised to:

- Avoid uploading confidential government or legal records publicly
- Handle sensitive legal information with care
- Not rely solely on AI-generated legal analysis for official legal decisions
- Always consult a qualified legal professional for official legal matters

---

## 📄 Attribution

This Security Policy follows industry standard responsible disclosure practices.

---

> This project is part of **GSSoC 2026**. We are committed to maintaining
> a safe and secure environment for all contributors and users! 🌱