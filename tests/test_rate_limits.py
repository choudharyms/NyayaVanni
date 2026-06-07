import os
import sys

os.environ["GEMINI_API_KEY"] = "dummy_key"

sys.path.append(os.path.abspath("backend"))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_route():
    response = client.get("/")
    assert response.status_code == 200

def test_session_rate_limit():
    last_response = None

    for _ in range(15):
        last_response = client.get("/api/session")

    assert last_response.status_code == 429