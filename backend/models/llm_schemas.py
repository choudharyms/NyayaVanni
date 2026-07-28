from datetime import date
from enum import Enum
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


class DiffStats(BaseModel):
    lines_added: int = Field(description="Number of lines added in the new version")
    lines_removed: int = Field(description="Number of lines removed from the old version")


class SeverityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class DiffClause(BaseModel):
    clause: str = Field(description="Name or identifier of the affected clause")
    severity: SeverityLevel = Field(description="How concerning this change is")
    detail: str = Field(description="Description of the change and its implications")


class PenaltyClause(BaseModel):
    clause: str = Field(description="Name or identifier of the affected clause")
    old_value: str = Field(description="The previous value or threshold")
    new_value: str = Field(description="The new value or threshold")
    detail: str = Field(description="Description of the penalty change")


class HiddenModification(BaseModel):
    clause: str = Field(description="Name or identifier of the affected clause")
    risk: SeverityLevel = Field(description="Risk level of this hidden change")
    detail: str = Field(description="Description of the modification")


class DiffAnalysisResult(BaseModel):
    overall_risk_level: SeverityLevel = Field(
        description="Overall risk level of the changes between versions"
    )
    summary: str = Field(
        description="A clear 2-3 sentence explanation of the key differences"
    )
    added_obligations: List[DiffClause] = Field(
        description="New obligations or duties introduced in the new version"
    )
    increased_penalties: List[PenaltyClause] = Field(
        description="Penalties or fees that have increased in the new version"
    )
    reduced_employee_rights: List[DiffClause] = Field(
        description="Rights or protections that have been reduced or removed"
    )
    hidden_modifications: List[HiddenModification] = Field(
        description="Subtle changes that may be easy to overlook"
    )
    new_legal_exposure: List[DiffClause] = Field(
        description="New areas of legal risk introduced in the new version"
    )
    recommended_actions: List[str] = Field(
        description="Actionable recommendations based on the differences"
    )


class DiffAnalysisResponse(BaseModel):
    diff_stats: DiffStats = Field(
        description="Statistics about the number of changes between versions"
    )
    analysis: DiffAnalysisResult = Field(
        description="Detailed analysis of the document differences"
    )
