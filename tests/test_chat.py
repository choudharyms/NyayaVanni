import pytest


def test_general_chat_returns_200(test_client, monkeypatch):
    """
    POST /api/chat/general returns 200 with the mocked response body.

    generate_chat_response is monkeypatched so the test runs in CI
    without a real GEMINI_API_KEY and without any external API calls.
    """
    monkeypatch.setattr(
        "api.routes.generate_chat_response",
        lambda *_args, **_kwargs: "You have the right to consult a lawyer.",
    )

    response = test_client.post(
        "/api/chat/general",
        json={
            "user_message": "What are my rights if I receive a legal notice?",
            "chat_history": [],
            "language": "en",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "You have the right to consult a lawyer."


def test_general_chat_empty_message_returns_400(test_client):
    """
    POST /api/chat/general with a blank user_message returns 400.
    No Gemini call is made so no monkeypatch needed.
    """
    response = test_client.post(
        "/api/chat/general",
        json={
            "user_message": "   ",
            "chat_history": [],
            "language": "en",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Message cannot be empty"


def test_general_chat_missing_user_message_returns_422(test_client):
    """
    POST /api/chat/general without the required user_message field
    returns 422 Unprocessable Entity from Pydantic validation.
    No route logic runs so no monkeypatch needed.
    """
    response = test_client.post(
        "/api/chat/general",
        json={"chat_history": [], "language": "en"},
    )

    assert response.status_code == 422


def test_general_chat_hindi_language(test_client, monkeypatch):
    """
    POST /api/chat/general with language='hi' returns 200.
    Verifies the language parameter is accepted and forwarded correctly.
    """
    captured = {}

    def mock_generate(*args, **kwargs):
        captured["language"] = args[3] if len(args) > 3 else kwargs.get("language")
        return "आपको एक वकील से परामर्श करने का अधिकार है।"

    monkeypatch.setattr("api.routes.generate_chat_response", mock_generate)

    response = test_client.post(
        "/api/chat/general",
        json={
            "user_message": "मुझे कानूनी नोटिस मिली है, मुझे क्या करना चाहिए?",
            "chat_history": [],
            "language": "hi",
        },
    )

    assert response.status_code == 200
    assert response.json()["response"] == "आपको एक वकील से परामर्श करने का अधिकार है।"
    assert captured.get("language") == "hi"


def test_general_chat_with_history(test_client, monkeypatch):
    """
    POST /api/chat/general with a non-empty chat_history returns 200.
    Verifies multi-turn conversation input is accepted.
    """
    monkeypatch.setattr(
        "api.routes.generate_chat_response",
        lambda *_args, **_kwargs: "Based on the context, you should respond within 30 days.",
    )

    response = test_client.post(
        "/api/chat/general",
        json={
            "user_message": "What should I do next?",
            "chat_history": [
                {"role": "user", "message": "I received a legal notice."},
                {"role": "assistant", "message": "Please share more details."},
            ],
            "language": "en",
        },
    )

    assert response.status_code == 200
    assert "response" in response.json()