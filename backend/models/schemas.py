from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., max_length=50)
    message: str = Field(..., max_length=50000)


class ChatRequest(BaseModel):
    user_message: str = Field(..., min_length=1, max_length=10000)
    chat_history: List[ChatMessage]
    language: str = Field(default="en", max_length=10)
    document_analysis: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., max_length=320)
    subject: str = Field(..., min_length=1, max_length=500)
    message: str = Field(..., min_length=10, max_length=10000)


class DocumentGenerationRequest(BaseModel):
    party_one_name: str
    party_two_name: str
    effective_date: str
    consideration_amount: str
    jurisdiction: str


class ClauseIndexRequest(BaseModel):
    document_id: str = Field(..., min_length=1, max_length=200)
    text: str = Field(..., min_length=1, max_length=1000000)


class ClauseSearchRequest(BaseModel):
    document_id: str = Field(..., min_length=1, max_length=200)
    query: str = Field(..., min_length=1, max_length=10000)
    k: int = Field(default=5, ge=1, le=25)
