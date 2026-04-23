import requests
res = requests.post("http://localhost:8000/api/analyze/document_123?language=en")
print(res.status_code)
print(res.text)
