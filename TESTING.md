# TESTING.md — NyayaVanni ⚖️

A complete reference for running existing tests, understanding the test structure, and writing new tests for the NyayaVanni project.

---

## Table of Contents

1. [Testing Stack](#1-testing-stack)
2. [Folder Structure](#2-folder-structure)
3. [Prerequisites](#3-prerequisites)
4. [Running the Test Suite](#4-running-the-test-suite)
5. [Test File Overview](#5-test-file-overview)
6. [How conftest.py Works](#6-how-conftestpy-works)
7. [Writing New Tests](#7-writing-new-tests)
8. [Known Issues & Import Gotchas](#8-known-issues--import-gotchas)
9. [CI Testing Pipeline](#9-ci-testing-pipeline)

---

## 1. Testing Stack

| Tool                            | Purpose                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `pytest`                        | Primary test runner for all backend tests                                    |
| `fastapi.testclient.TestClient` | Simulates HTTP requests to the FastAPI app without a live server             |
| `pytest monkeypatch`            | Mocks external services (e.g. Gemini API) so tests run without real API keys |

There is no frontend test suite at this time. All tests cover the FastAPI backend.

---

## 2. Folder Structure

```
NyayaVanni/
├── tests/
│   ├── conftest.py           # Shared fixtures (TestClient setup, sys.path config)
│   ├── test_chat.py          # Tests for POST /api/chat/general endpoint
│   ├── test_gemini_parse.py  # Unit tests for Gemini response parser
│   └── run_parse_tests.py    # Standalone script to test the parser without pytest
```

---

## 3. Prerequisites

Before running tests, make sure the backend is set up:

```bash
cd backend
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

> **Note:** Tests do **not** require a real `GEMINI_API_KEY`. External API calls are mocked using `monkeypatch` in tests that would otherwise hit the Gemini API.

---

## 4. Running the Test Suite

All pytest commands must be run from the **project root** (not inside `backend/` or `tests/`).

### Run all tests

```bash
pytest -q
```

### Run a specific test file

```bash
pytest tests/test_chat.py -v
pytest tests/test_gemini_parse.py -v
```

### Run a specific test by name

```bash
pytest tests/test_chat.py::test_general_chat_returns_200 -v
```

### Run the standalone parser script (no pytest needed)

```bash
python tests/run_parse_tests.py
```

Expected output:

```
test_parse_from_json_method: OK
test_parse_from_fenced_text: OK
test_parse_from_embedded_text: OK

All tests passed
```

### Run with verbose output

```bash
pytest -v
```

### Stop on first failure

```bash
pytest -x
```

---

## 5. Test File Overview

### `test_chat.py`

Tests the `POST /api/chat/general` endpoint end-to-end using `TestClient`.

| Test                                                 | What it checks                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| `test_general_chat_returns_200`                      | Happy path — valid request returns 200 with expected response body  |
| `test_general_chat_empty_message_returns_400`        | Blank `user_message` returns 400 with correct error detail          |
| `test_general_chat_missing_user_message_returns_422` | Missing required field returns 422 from Pydantic validation         |
| `test_general_chat_hindi_language`                   | `language: "hi"` is accepted and forwarded correctly to the service |
| `test_general_chat_with_history`                     | Non-empty `chat_history` is accepted and returns 200                |

All tests that call Gemini mock `api.routes.generate_chat_response` via `monkeypatch` — no real API key needed.

---

### `test_gemini_parse.py`

Unit tests for `_parse_structured_response` — the internal function in `backend/services/gemini_service.py` that parses Gemini's raw output into structured JSON.

| Test                            | What it checks                                                 |
| ------------------------------- | -------------------------------------------------------------- |
| `test_parse_from_json_method`   | Parses response objects that have a `.json()` method           |
| `test_parse_from_fenced_text`   | Parses responses wrapped in ` ```json ``` ` fenced code blocks |
| `test_parse_from_embedded_text` | Parses raw JSON embedded inside plain text                     |

---

### `run_parse_tests.py`

A self-contained script that runs the same three parser tests as `test_gemini_parse.py` but without pytest. It stubs out the `google.genai` module so it can run in environments where the Gemini package isn't configured.

Use this for quick local verification without needing the full test setup.

---

## 6. How `conftest.py` Works

`conftest.py` does two important things:

### 1. Fixes the import path

```python
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, os.path.abspath(BACKEND_DIR))
```

This puts `backend/` at the front of `sys.path` so that `from main import app` resolves to `backend/main.py` correctly when pytest runs from the project root.

### 2. Provides shared fixtures

```python
@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_client(client):
    return client  # alias for backward compatibility
```

Both `client` and `test_client` are available in any test file — use whichever is already referenced in the test you're writing.

> **Important:** Do not call `app.include_router()` inside `conftest.py` or any test file. The router is already registered in `backend/main.py`. Registering it again causes duplicate routes and incorrect test behaviour.

---

## 7. Writing New Tests

### Basic test structure

```python
def test_my_endpoint(test_client, monkeypatch):
    # 1. Mock any external services
    monkeypatch.setattr(
        "api.routes.some_service_function",
        lambda *args, **kwargs: "mocked response"
    )

    # 2. Make the request
    response = test_client.post(
        "/api/your-endpoint",
        json={"key": "value"}
    )

    # 3. Assert the result
    assert response.status_code == 200
    assert response.json()["field"] == "expected value"
```

### Rules for new tests

- **Always mock Gemini calls.** Use `monkeypatch.setattr` to replace `generate_chat_response`, `analyze_document_with_gemini`, or any other function that calls the Gemini API. Tests must pass in CI without a real API key.
- **Use `test_client` fixture** from `conftest.py` — don't create a new `TestClient` inside individual test files.
- **Import from `services.*` not `backend.services.*`** inside `conftest.py` and route-level mocks. The `backend/` directory is already on `sys.path`. See [Known Issues](#8-known-issues--import-gotchas) below.
- **Name tests descriptively** — follow the pattern `test_<feature>_<condition>_returns_<status>` (e.g. `test_upload_empty_file_returns_400`).
- **One assertion focus per test** — each test should verify one specific behaviour.

### Adding a new dependency used in tests

If your new test requires a package not already in `requirements.txt`, add it there. CI installs only what is listed in `requirements.txt` — a package that works locally but is missing from the file will break CI.

```
# requirements.txt
your-new-package
```

---

## 8. Known Issues & Import Gotchas

### `ModuleNotFoundError: No module named 'backend'`

**Cause:** `test_gemini_parse.py` uses `from backend.services.gemini_service import ...` which fails when pytest runs from the project root because `backend` is not a package on `sys.path` — it's a directory whose contents are on `sys.path` (added by `conftest.py`).

**Fix:** Change imports in test files from:

```python
from backend.services.gemini_service import analyze_document_with_gemini
```

to:

```python
from services.gemini_service import analyze_document_with_gemini
```

### `ModuleNotFoundError: No module named 'docx'`

**Cause:** `python-docx` was added to the codebase (`ocr_service.py`) but was missing from `requirements.txt`. CI starts from a clean environment every run.

**Fix:** Ensure `python-docx` is listed in `backend/requirements.txt`. This was resolved in the `docs/DEVELOPMENT.md` PR.

### FAISS index is empty after restarting

The FAISS vector store is in-memory only. It resets on every backend restart. Re-upload your document before running chat-related manual tests.

### `google.generativeai` deprecation warning

```
All support for the `google.generativeai` package has ended.
```

This is a warning, not an error. Tests still pass. Migration to `google.genai` is tracked as a separate task.

---

## 9. CI Testing Pipeline

Tests run automatically on every push and pull request via GitHub Actions.

### What the CI does

1. **Checkout** the repository
2. **Set up Python** (3.10)
3. **Install dependencies** — `pip install -r backend/requirements.txt`
4. **Run tests** — `pytest -q` from the project root

### Viewing CI results

Go to the **Actions** tab on GitHub → select the latest workflow run → expand the **Run tests** step to see the full pytest output.

### Making sure your PR passes CI

Before pushing, run locally:

```bash
pytest -q
```

If all tests pass locally from the project root with a clean environment, they will pass in CI.

---

For the full local environment setup, see [DEVELOPMENT.md](./DEVELOPMENT.md).
For the contribution workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).
