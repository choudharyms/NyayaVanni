# Contributing to NyayaVanni ⚖️

Thank you for your interest in contributing to NyayaVanni!
We welcome contributors of all experience levels, including first-time open-source contributors and GSSoC participants.
Please follow the guidelines below to ensure a smooth and organized contribution process.

---

# 📌 Project Structure

NyayaVanni follows a full-stack architecture:

- `backend/` → Python backend services and API logic
- `frontend/` → React + Vite frontend application
- `.env.example` → Environment variable reference
- `CONTRIBUTING.md` → Contribution guidelines
- `ARCHITECTURE.md` → System architecture and data flow

Before contributing, it is recommended to explore the repository structure and understand how the frontend and backend interact.

---

# 🚀 Contribution Workflow

## 1. Fork the Repository

Click the **Fork** button on GitHub to create your own copy of the repository.

---

## 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/NyayaVanni.git
cd NyayaVanni
```

---

## 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/choudharyms/NyayaVanni.git
```

Verify remotes:

```bash
git remote -v
```

---

## 4. Create a New Branch

Always create a separate branch before making any changes.

### Branch Naming Conventions

| Type | Format |
|---|---|
| Feature | `feat/feature-name` |
| Bug Fix | `fix/bug-description` |
| Documentation | `docs/topic-name` |
| Style | `style/component-name` |
| Refactor | `refactor/service-name` |
| Test | `test/feature-name` |

Example:

```bash
git checkout -b docs/update-contributing-guide
```

Avoid committing directly to the `main` branch.

---

## 5. Make Your Changes

After creating your branch:

- Implement your feature or fix
- Follow the existing project structure
- Test changes locally before committing

---

## 6. Stage and Commit Changes

```bash
git add .
git commit -m "docs: improve contributing guidelines"
```

---

## 7. Push Changes to Your Fork

```bash
git push origin docs/update-contributing-guide
```

---

## 8. Open a Pull Request

- Go to your forked repository on GitHub
- Click **Compare & Pull Request**
- Add a proper title and description
- Link the related issue number: `Closes #12`
- Submit the pull request for review

---

# 🛠️ Local Environment Setup

## Backend Setup (Python)

### 1. Navigate to the backend folder

```bash
cd backend
```

### 2. Create and activate a Python virtual environment

```bash
python -m venv venv
source venv/bin/activate
```

On Windows:

```bash
.\venv\Scripts\activate
```

### 3. Install required dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

- Update `GEMINI_API_KEY` with your valid credential

### 5. Run the backend server

```bash
uvicorn main:app --reload
```

Backend runs at: http://127.0.0.1:8000

---

## Frontend Setup (React + Vite)

### 1. Navigate to the frontend folder

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Start the local development server

```bash
npm run dev
```

Frontend runs at: http://localhost:5173

---

# 🧹 Commit Message Convention

| Type | When to Use | Example |
|---|---|---|
| `feat` | New feature added | `feat: add OCR confidence validation` |
| `fix` | Bug fix | `fix: prevent fake legal analysis` |
| `docs` | Documentation changes | `docs: improve contributing guidelines` |
| `style` | UI or formatting changes | `style: improve dashboard UI` |
| `refactor` | Code restructuring | `refactor: clean up gemini service` |
| `test` | Adding or fixing tests | `test: add upload endpoint tests` |
| `chore` | Config or dependency updates | `chore: update requirements.txt` |

---

# 🎨 Code Style Guidelines

## Backend (Python)

- Follow PEP 8 coding standards
- Use meaningful variable and function names
- Add docstrings to all functions and classes
- Keep functions small and single-purpose
- Never hardcode API keys or secrets

## Frontend (React)

- Use functional components with hooks
- Keep components small and reusable
- Use meaningful component and variable names
- Follow existing folder structure under `src/`
- Use Tailwind CSS utility classes for styling
- Never hardcode API URLs — always use `VITE_API_URL` from `.env`

---

# 🧪 Frontend Validation

Run these commands from the `frontend/` directory before submitting any UI changes.

### 1. Check code quality

```bash
npm run lint
```

### 2. Verify production build

```bash
npm run build
```

### 3. Preview built UI locally

```bash
npm run preview
```

Open the preview URL shown in terminal and manually verify your changes look correct.

---

# 📸 How to Add Screenshots to Your PR

If your PR includes any frontend UI changes, you MUST attach screenshots.

## Taking a Screenshot

### On Mac

| What | Shortcut |
|---|---|
| Full screen | `Cmd + Shift + 3` |
| Selected area | `Cmd + Shift + 4` |
| Specific window | `Cmd + Shift + 4`, then `Space` |

Screenshots are automatically saved to your Desktop.

### On Windows

| What | Shortcut |
|---|---|
| Full screen | `Win + PrtScn` |
| Selected area | `Win + Shift + S` |

### On Linux

| What | Shortcut |
|---|---|
| Full screen | `PrtScn` |
| Selected area | `Shift + PrtScn` |

## Attaching to Your PR

1. Open your Pull Request on GitHub
2. Click inside the description box
3. Drag and drop your screenshot directly into the box
4. GitHub will auto-upload and insert the image like this:

```text
![image](https://user-images.githubusercontent.com/...)
```

You can also paste with `Cmd+V` (Mac) or `Ctrl+V` (Windows).

## What to Screenshot

- Before and after if you changed existing UI
- New component or page you added
- Any visual bug you fixed
- Full page view of the affected screen

---

# 🔍 Self-Review Checklist Before Submitting PR

- [ ] Branch name follows convention (`feat/`, `fix/`, `docs/`)
- [ ] Commit message is descriptive and follows convention
- [ ] Issue is linked in PR description (`Closes #IssueNumber`)
- [ ] Changes tested locally and everything works
- [ ] For frontend changes — screenshots attached
- [ ] `npm run lint` passes without errors
- [ ] `npm run build` completes without errors
- [ ] For backend changes — API endpoints tested manually
- [ ] Only files related to the issue are changed
- [ ] No `.env` file with real API keys pushed

---

# 🚫 Common Mistakes to Avoid

- Do NOT commit directly to `main` branch
- Do NOT open a PR without linking an issue
- Do NOT bundle multiple unrelated fixes in one PR
- Do NOT push your `.env` file with real API keys
- Do NOT ignore lint errors before submitting
- Do NOT hardcode API URLs in frontend code

---

# 📥 Pull Request Guidelines

- **Always link your issue:** PR description must contain `Closes #IssueNumber`
- **One PR per issue:** Do not bundle multiple unrelated fixes
- **Self-Review:** Test locally before submitting
- **Screenshots:** Attach for any frontend UI changes
- **Small PRs:** Keep changes focused and minimal

---

# 🌱 First Time Contributing?

Welcome! Here is a simple checklist for first-timers:

1. Read this entire CONTRIBUTING.md carefully
2. Read the README.md to understand the project
3. Set up your local environment (backend + frontend)
4. Look for issues labeled `good first issue` on GitHub
5. Comment on the issue: "I would like to work on this"
6. Wait for a maintainer to assign it to you
7. Create your branch and start working
8. Submit your PR with a clear description and screenshots

---

# ❓ Need Help?

If you are stuck or have questions:

- Open a GitHub Discussion
- Comment on the relevant issue
- Tag a maintainer in your Pull Request

We are happy to help first-time contributors! 💖

---

# ❤️ Contributors

Thank you to everyone contributing to NyayaVanni!

**Core Contributors**

- **Madhusudan** - GitHub: @choudharyms
- **Siddhi Sharma** - GitHub: @sidbyte07

## ✨ All Contributors

This project is made possible by all the amazing people who contribute!

[![NyayaVanni Contributors](https://contrib.rocks/image?repo=choudharyms/NyayaVanni)](https://github.com/choudharyms/NyayaVanni/graphs/contributors)
