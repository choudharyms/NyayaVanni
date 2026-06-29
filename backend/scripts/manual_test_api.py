import requests

api_url = "http://localhost:8000"

print("1. Creating session...")
session_response = requests.get(f"{api_url}/api/session")
session_response.raise_for_status()
data = session_response.json()
print("Session Response:", data)
session_id = data.get("sessionId")
assert session_id is not None, "sessionId is missing from /api/session"

print("\n2. Testing /api/analyze-text endpoint...")
test_text = (
    "Terms of Service. 1. Intellectual Property: All content on this website belongs to the owner. "
    "2. Privacy: We collect user emails and locations. 3. Liability: We are not responsible for user data loss. "
    "4. Termination: We can delete accounts at any time for any reason."
)

res_analyze = requests.post(
    f"{api_url}/api/analyze-text",
    headers={"X-Session-Id": session_id},
    json={"text": test_text, "language": "en"},
)
print("Analyze Status Code:", res_analyze.status_code)
if res_analyze.status_code == 200:
    res_data = res_analyze.json()
    print("Document ID created:", res_data.get("documentId"))
    print("Risk Level:", res_data.get("analysis", {}).get("risk_level"))
    print("Summary:", res_data.get("analysis", {}).get("summary"))
    print("Clauses extracted:", len(res_data.get("analysis", {}).get("clauses", [])))
    print("Consequences:", len(res_data.get("analysis", {}).get("consequences", [])))
    print("Actions recommended:", len(res_data.get("analysis", {}).get("actions", [])))
else:
    print("Error:", res_analyze.text)
