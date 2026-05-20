from pydantic import BaseModel
from typing import List

class ChatMessage(BaseModel):
    role: str
    message: str

class ChatRequest(BaseModel):
    user_message: str
    chat_history: List[ChatMessage]
    language: str = "en"

class ChatResponse(BaseModel):
    response: str

class DocumentGenerationRequest(BaseModel):
    party_one_name: str
    party_two_name: str
    effective_date: str
    consideration_amount: str
    jurisdiction: str
