import requests

doc_id = "b080f8fa-4249-4e87-b2ef-a1b9172a21f9"
res_analyze = requests.post(f"http://localhost:8000/api/analyze/{doc_id}?language=en")
print("Analyze status:", res_analyze.status_code)
with open("trace.txt", "w") as f:
    f.write(res_analyze.text)
