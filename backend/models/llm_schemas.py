from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


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
    consequences: List[str] = Field(description="List of potential outcomes")
    recommended_timeline: str = Field(description="e.g., Respond within X days")
    actions: List[ActionItem]


class ComparisonSummary(BaseModel):
    matched: int = Field(..., description="Number of unchanged/matched clauses")
    modified: int = Field(..., description="Number of modified clauses")
    added: int = Field(..., description="Number of added clauses")
    removed: int = Field(..., description="Number of removed clauses")


class ClauseComparison(BaseModel):
    status: Literal["unchanged", "modified", "added", "removed"]
    oldClause: str = Field(default="", description="The content of the clause in the old document, or empty string if added")
    newClause: str = Field(default="", description="The content of the clause in the new document, or empty string if removed")
    category: Literal["Payment", "Liability", "Termination", "Privacy", "Intellectual Property", "Dispute Resolution", "Other"] = Field(
        ..., description="The functional legal category of the clause"
    )



class AISummary(BaseModel):
    payment: str = Field(..., description="Concise summary of payment term changes")
    liability: str = Field(..., description="Concise summary of liability changes")
    termination: str = Field(..., description="Concise summary of termination changes")
    privacy: str = Field(..., description="Concise summary of privacy changes")
    intellectual_property: str = Field(..., description="Concise summary of intellectual property changes")
    dispute_resolution: str = Field(..., description="Concise summary of dispute resolution changes")


class CompareResponse(BaseModel):
    summary: ComparisonSummary
    clauses: List[ClauseComparison]
    ai_summary: AISummary

