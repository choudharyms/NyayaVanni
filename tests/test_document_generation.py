def test_generate_document_without_session_returns_401(test_client):
    response = test_client.post(
        "/api/generate-document",
        json={
            "effective_date": "2026-07-01",
            "party_one_name": "ABC Technologies Pvt. Ltd.",
            "party_two_name": "John Doe",
            "consideration_amount": "INR 50,000",
            "jurisdiction": "New Delhi, India",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing session_id cookie"
