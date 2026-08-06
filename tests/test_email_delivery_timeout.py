import os
import sys
import time

os.environ["GEMINI_API_KEY"] = "dummy_key"

sys.path.append(os.path.abspath("backend"))

from fastapi.testclient import TestClient
from main import app

import backend.api.routes as routes

client = TestClient(app)


def test_email_delivery_succeeds_within_timeout(monkeypatch):
    def fast_send(to, subject, body):
        return None

    monkeypatch.setattr(routes, "send_email", fast_send)
    monkeypatch.setattr(routes, "EMAIL_DELIVERY_TIMEOUT", 5)

    response = client.post(
        "/api/email/send",
        json={"to": "user@example.com", "subject": "Test", "body": "Hello"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Email accepted for delivery"


def test_email_delivery_times_out_when_server_hangs(monkeypatch):
    def slow_send(to, subject, body):
        time.sleep(5)

    monkeypatch.setattr(routes, "send_email", slow_send)
    monkeypatch.setattr(routes, "EMAIL_DELIVERY_TIMEOUT", 0.1)

    response = client.post(
        "/api/email/send",
        json={"to": "user@example.com", "subject": "Test", "body": "Hello"},
    )
    assert response.status_code == 504


def test_email_delivery_returns_502_on_send_error(monkeypatch):
    def failing_send(to, subject, body):
        raise OSError("connection refused")

    monkeypatch.setattr(routes, "send_email", failing_send)
    monkeypatch.setattr(routes, "EMAIL_DELIVERY_TIMEOUT", 5)

    response = client.post(
        "/api/email/send",
        json={"to": "user@example.com", "subject": "Test", "body": "Hello"},
    )
    assert response.status_code == 502


def test_email_send_rejects_missing_fields():
    response = client.post(
        "/api/email/send", json={"to": "user@example.com"}
    )
    assert response.status_code == 422


def test_email_delivery_timeout_is_env_driven():
    assert routes.EMAIL_DELIVERY_TIMEOUT > 0
