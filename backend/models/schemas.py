from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    message: str


class ChatRequest(BaseModel):
    user_message: str = Field(..., max_length=4000)
    chat_history: List[ChatMessage] = Field(default_factory=list, max_length=50)
    language: str = "en"
    document_analysis: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str


class ContactRequest(BaseModel):
    name: str = Field(..., max_length=200)
    email: str = Field(..., max_length=254)
    subject: str = Field(..., max_length=500)
    message: str = Field(..., max_length=5000)


class DocumentGenerationRequest(BaseModel):
    party_one_name: str
    party_two_name: str
    effective_date: str
    consideration_amount: str
    jurisdiction: str
