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
