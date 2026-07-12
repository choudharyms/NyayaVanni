import io


def test_diff_analysis_rejects_file_with_mismatched_content(test_client):
    session_response = test_client.get("/api/session")
    assert session_response.status_code == 200

    response = test_client.post(
        "/api/diff-analysis",
        files={
            "old_document": (
                "old.pdf",
                io.BytesIO(b"not a real pdf"),
                "application/pdf",
            ),
            "new_document": (
                "new.pdf",
                io.BytesIO(b"not a real pdf either"),
                "application/pdf",
            ),
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "File content does not match the claimed file type. Upload rejected."
    )
