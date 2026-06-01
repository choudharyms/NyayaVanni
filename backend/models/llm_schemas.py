from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date


# Define Pydantic models for structured data
class Party(BaseModel):
    name: str
    role: str

class DateEntry(BaseModel):
    # Using Literal to restrict the type to specific choices
    type: Literal["notice_date", "response_deadline"]
    # Pydantic will automatically validate strings like "2024-12-31" into date objects
    value: date 

class ActionItem(BaseModel):
    priority: Literal["high", "medium", "low"]
    action: str = Field(description="What to do next")
    why: str = Field(description="Reason for the action")
    timeline: str = Field(description="When to do it")

class DocumentAnalysis(BaseModel):
    document_type: str = Field(
        description="Type of document (e.g., FIR, Notice, Contract, etc.)"
    )
    parties: List[Party]
    dates: List[DateEntry]
    sections: List[str] = Field(
        description="Extract explicit legal sections/laws from Document, or apply from Relevant Laws"
    )
    clauses: List[str] = Field(
        description="Extract key clauses/obligations from Document"
    )
    summary: str = Field(
        description="A clear 2-3 sentence explanation of the document."
    )
    risk_level: Literal["Low", "Medium", "High"]
    urgency: Literal["Immediate", "Soon", "Normal"]
    consequences: List[str] = Field(
        description="List of potential outcomes"
    )
    recommended_timeline: str = Field(
        description="e.g., Respond within X days"
    )
    actions: List[ActionItem]
