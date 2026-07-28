import json
import sys
import os
from importlib import import_module

# Ensure project root is on sys.path so imports like 'backend.services' work
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Also add the backend folder so modules using top-level 'services' import work
BACKEND_PATH = os.path.join(ROOT, 'backend')
if BACKEND_PATH not in sys.path:
    sys.path.insert(0, BACKEND_PATH)

# Provide a lightweight stub for google.genai and google.generativeai to avoid import/runtime errors
import types
if 'google.generativeai' not in sys.modules:
    google_mod = sys.modules.get('google') or types.ModuleType('google')
    sys.modules['google'] = google_mod
    
    genai_mod = types.ModuleType('google.generativeai')
    def _configure(*args, **kwargs):
        return None
    class _GenerativeModel:
        def __init__(self, *args, **kwargs):
            pass
        def generate_content(self, *args, **kwargs):
            return ''
    genai_mod.configure = _configure
    genai_mod.GenerativeModel = _GenerativeModel
    sys.modules['google.generativeai'] = genai_mod
    setattr(google_mod, 'generativeai', genai_mod)
    
    # Also keep genai stubs for future-proofing
    genai_stub = types.ModuleType('google.genai')
    genai_stub.configure = _configure
    genai_stub.GenerativeModel = _GenerativeModel
    sys.modules['google.genai'] = genai_stub
    setattr(google_mod, 'genai', genai_stub)

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


def run_all():
    data = sample_payload()
    # Test json method
    resp1 = MockRespJSON(data)
    parsed1 = _parse(resp1)
    assert parsed1 == data, f"json method test failed: {parsed1}"
    print('test_parse_from_json_method: OK')

    # Test fenced text
    txt = "Here is the analysis:\n```json\n" + json.dumps(data) + "\n```"
    resp2 = MockRespText(txt)
    parsed2 = _parse(resp2)
    assert parsed2 == data, f"fenced text test failed: {parsed2}"
    print('test_parse_from_fenced_text: OK')

    # Test embedded text
    txt3 = "Intro text..." + json.dumps(data) + "...trailer"
    resp3 = MockRespText(txt3)
    parsed3 = _parse(resp3)
    assert parsed3 == data, f"embedded text test failed: {parsed3}"
    print('test_parse_from_embedded_text: OK')

    # Diff analysis parse tests
    diff_data = sample_diff_payload()

    # Test diff json method
    resp4 = MockRespJSON(diff_data)
    parsed4 = _parse(resp4)
    assert parsed4 == diff_data, f"diff json method test failed: {parsed4}"
    print('test_diff_parse_from_json_method: OK')

    # Test diff fenced text
    txt5 = "Diff analysis:\n```json\n" + json.dumps(diff_data) + "\n```"
    resp5 = MockRespText(txt5)
    parsed5 = _parse(resp5)
    assert parsed5 == diff_data, f"diff fenced text test failed: {parsed5}"
    print('test_diff_parse_from_fenced_text: OK')

    # Test DiffAnalysisResponse schema validation
    from backend.models.llm_schemas import DiffAnalysisResponse
    validated = DiffAnalysisResponse(**diff_data)
    assert validated.diff_stats.lines_added == 15
    assert validated.diff_stats.lines_removed == 8
    assert validated.analysis.overall_risk_level.value == "high"
    assert len(validated.analysis.recommended_actions) == 2
    print('test_diff_parse_schema_validation: OK')

if __name__ == '__main__':
    try:
        run_all()
        print('\nAll tests passed')
        sys.exit(0)
    except AssertionError as e:
        print('Test failed:', e)
        sys.exit(2)
    except Exception as e:
        print('Error running tests:', e)
        sys.exit(3)
