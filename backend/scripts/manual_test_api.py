import requests

api_url = "http://localhost:8000"
session_response = requests.get(f"{api_url}/api/session")
session_response.raise_for_status()
session_id = session_response.json().get("sessionId")

doc_id = "b080f8fa-4249-4e87-b2ef-a1b9172a21f9"
res_analyze = requests.post(
    f"{api_url}/api/analyze/{doc_id}?language=en",
    headers={"X-Session-Id": session_id},
)
print("Analyze status:", res_analyze.status_code)
with open("trace.txt", "w") as f:
    f.write(res_analyze.text)
