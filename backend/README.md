# NyayaVanni API Documentation

## 0. Create Session
**Endpoint:** `GET /api/session`
**Response:**
```json
{
  "sessionId": "uuid"
}
```

Use the returned `sessionId` as the `X-Session-Id` header for all document-scoped requests.

## 1. Upload Document
**Endpoint:** `POST /api/upload`
**Content-Type:** `multipart/form-data`
**Headers:**
- `X-Session-Id`: Session identifier returned by `/api/session`
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
**Headers:**
- `X-Session-Id`: Session identifier returned by `/api/session`
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
**Headers:**
- `X-Session-Id`: Session identifier returned by `/api/session`
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

## 4. Delete Document
**Endpoint:** `DELETE /api/documents/{documentId}`
**Headers:**
- `X-Session-Id`: Session identifier returned by `/api/session`

**Response:**
```json
{
  "documentId": "uuid",
  "deleted": true
}
```

## Data Lifecycle (MVP)
- Stored data: uploaded file, extracted text, and analysis JSON.
- Storage locations: `backend/uploads/` (file system) and `backend/data/nyayavanni.db` (SQLite).
- Retention: data is stored until the document is deleted.
- Deletion: call `DELETE /api/documents/{documentId}` with the correct `X-Session-Id`.
