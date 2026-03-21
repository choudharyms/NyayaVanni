from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str
    message: str

class ChatRequest(BaseModel):
    user_message: str
    chat_history: List[ChatMessage]
    # In a real app, we fetch document_analysis from DynamoDB using documentId
    # For MVP portability, allow passing it in if needed, or just let backend fetch it.
    document_analysis: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"

class ChatResponse(BaseModel):
    response: str
