import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture
def client():
    """Return a client for the fully configured application."""
    return TestClient(app)


@pytest.fixture
def test_client(client):
    """Backward-compatible alias used by existing tests."""
    return client
