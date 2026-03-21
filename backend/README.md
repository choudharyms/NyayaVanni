# NyayaVanni API Documentation

## 1. Upload Document
**Endpoint:** `POST /api/upload`
**Content-Type:** `multipart/form-data`
**Parameters:**
- `file`: The document (PDF, PNG, JPG)

**Response:**
```json
{
  "documentId": "uuid",
  "message": "Uploaded successfully"
}
```

## 2. Analyze Document
**Endpoint:** `POST /api/analyze/{documentId}`
**Content-Type:** `multipart/form-data` (MVP mode accepts file)
**Response:**
```json
{
  "documentId": "uuid",
  "analysis": {
    "document_type": "string",
    "parties": [...],
    "dates": [...],
    "sections": [...],
    "clauses": [...],
    "summary": "string",
    "risk_level": "High|Medium|Low",
    "urgency": "string",
    "consequences": [...],
    "recommended_timeline": "string",
    "actions": [...]
  },
  "extracted_text": "string..."
}
```

## 3. Chat with Document
**Endpoint:** `POST /api/chat/{documentId}`
**Content-Type:** `application/json`
**Body:**
```json
{
  "user_message": "string",
  "chat_history": [
    {"role": "user", "message": "string"},
    {"role": "assistant", "message": "string"}
  ],
  "document_analysis": {} // Optional cache
}
```
**Response:**
```json
{
  "response": "AI's helpful answer"
}
```
