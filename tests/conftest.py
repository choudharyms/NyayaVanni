 main
import os
import sys
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from api.routes import api_router
from main import app

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend/ is first on sys.path so "from main import app" resolves
# to backend/main.py and not the empty root/main.py stub.
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, os.path.abspath(BACKEND_DIR))

from main import app  # noqa: E402 — import after sys.path is set

 main

@pytest.fixture
def client():
    """
    Returns a FastAPI TestClient for the fully configured app.

    The api_router is already registered in backend/main.py with the
    /api prefix — we must not call include_router again here, as doing
    so registers every route twice (once at /api/... and once at /...),
    causing duplicate operation ID warnings and incorrect test routing.
    """
    return TestClient(app)


@pytest.fixture
def test_client(client):
    """Alias for client — keeps backward compatibility with existing tests."""
    return client