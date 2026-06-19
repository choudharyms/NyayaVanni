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


# New Forensic audit models
class AsymmetricClause(BaseModel):
    clause_name: str = Field(description="Name of the clause (e.g. Termination for Convenience)")
    quoted_text: str = Field(description="Exact quote from the document text")
    bias_direction: Literal["disclosing_party", "receiving_party", "mutual_unfavorable"]
    severity: Literal["low", "medium", "high", "critical"]
    analysis: str = Field(description="Explanation of why this clause is asymmetric or sneaky")


class LawBreach(BaseModel):
    clause_affected: str = Field(description="Name of the clause in question")
    indian_law_citation: str = Field(description="Relevant Section and Act (e.g. Section 27, Indian Contract Act)")
    is_voidable: bool = Field(description="Whether the clause is legally void or voidable under Indian law")
    reasoning: str = Field(description="Detailed explanation of the compliance conflict")


class AdversarialLoophole(BaseModel):
    title: str = Field(description="Loophole name")
    exploit_scenario: str = Field(description="How the opposing party could exploit this clause in court")
    exposure_level: Literal["low", "medium", "high", "critical"]
    remediation: str = Field(description="How to rewrite the clause to protect the user")


class ForensicReport(BaseModel):
    asymmetric_clauses: List[AsymmetricClause]
    compliance_breaches: List[LawBreach]
    loopholes: List[AdversarialLoophole]
    executive_summary: str = Field(description="Overall forensic assessment of the document")


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
    forensic_audit: Optional[ForensicReport] = None
