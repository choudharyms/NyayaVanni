import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, field_validator


class ChatMessage(BaseModel):
    role: str
    message: str


class ChatRequest(BaseModel):
    user_message: str
    chat_history: List[ChatMessage]
    language: str = "en"
    document_analysis: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str


class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str


class DocumentGenerationRequest(BaseModel):
    party_one_name: str
    party_two_name: str
    effective_date: str
    consideration_amount: str
    jurisdiction: str


class NotificationTemplateRequest(BaseModel):
    name: str
    subject: str
    body: str

    @field_validator("name")
    @classmethod
    def validate_template_name(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError(
                "Template name must contain only alphanumeric characters, underscores, and hyphens."
            )
        return v


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-\\[\]~`]", v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v
