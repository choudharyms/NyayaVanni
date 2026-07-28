import json
from backend.services.gemini_service import analyze_document_with_gemini
from backend.services.gemini_service import DocumentAnalysis

# We'll import the internal parser via function name lookup
from importlib import import_module
mod = import_module('backend.services.gemini_service')
_parse = getattr(mod, '_parse_structured_response')

class MockRespJSON:
    def __init__(self, data):
        self._data = data
    def json(self):
        return self._data

class MockRespText:
    def __init__(self, text):
        self.text = text

def sample_payload():
    return {
        "document_type": "Notice",
        "parties": [{"name": "Alice", "role": "plaintiff"}],
        "dates": [{"type": "notice_date", "value": "2024-12-31"}],
        "sections": ["Section 1"],
        "clauses": ["Clause A"],
        "summary": "Short summary.",
        "risk_level": "Low",
        "urgency": "Normal",
        "consequences": ["None"],
        "recommended_timeline": "Respond within 7 days",
        "actions": [{"priority": "high", "action": "Do X", "why": "Because", "timeline": "ASAP"}]
    }

def test_parse_from_json_method():
    data = sample_payload()
    resp = MockRespJSON(data)
    parsed = _parse(resp)
    assert parsed == data

def test_parse_from_fenced_text():
    data = sample_payload()
    txt = "Here is the analysis:\n```json\n" + json.dumps(data) + "\n```"
    resp = MockRespText(txt)
    parsed = _parse(resp)
    assert parsed == data

def test_parse_from_embedded_text():
    data = sample_payload()
    txt = "Intro text..." + json.dumps(data) + "...trailer"
    resp = MockRespText(txt)
    parsed = _parse(resp)
    assert parsed == data


def sample_diff_payload():
    return {
        "diff_stats": {
            "lines_added": 15,
            "lines_removed": 8
        },
        "analysis": {
            "overall_risk_level": "high",
            "summary": "The new version introduces additional employee obligations and increases penalty clauses.",
            "added_obligations": [
                {"clause": "Non-compete", "severity": "high", "detail": "12-month non-compete added"}
            ],
            "increased_penalties": [
                {"clause": "Late fee", "old_value": "5%", "new_value": "10%", "detail": "Penalty doubled"}
            ],
            "reduced_employee_rights": [
                {"clause": "Leave policy", "severity": "medium", "detail": "Sick leave reduced from 12 to 6 days"}
            ],
            "hidden_modifications": [
                {"clause": "Arbitration", "risk": "critical", "detail": "Mandatory arbitration clause added in fine print"}
            ],
            "new_legal_exposure": [
                {"clause": "Data sharing", "severity": "high", "detail": "Employee data may be shared with third parties"}
            ],
            "recommended_actions": [
                "Consult a lawyer before signing",
                "Negotiate non-compete clause"
            ]
        }
    }


def test_diff_parse_from_json_method():
    data = sample_diff_payload()
    resp = MockRespJSON(data)
    parsed = _parse(resp)
    assert parsed == data


def test_diff_parse_from_fenced_text():
    data = sample_diff_payload()
    txt = "Diff analysis:\n```json\n" + json.dumps(data) + "\n```"
    resp = MockRespText(txt)
    parsed = _parse(resp)
    assert parsed == data


def test_diff_parse_schema_validation():
    from backend.models.llm_schemas import DiffAnalysisResponse
    data = sample_diff_payload()
    validated = DiffAnalysisResponse(**data)
    assert validated.diff_stats.lines_added == 15
    assert validated.diff_stats.lines_removed == 8
    assert validated.analysis.overall_risk_level.value == "high"
    assert len(validated.analysis.recommended_actions) == 2
