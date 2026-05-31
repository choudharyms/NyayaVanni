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

# Provide a lightweight stub for google.genai to avoid import/runtime errors
import types
if 'google.genai' not in sys.modules:
    google_mod = types.ModuleType('google')
    genai_mod = types.ModuleType('google.genai')
    def _configure(*args, **kwargs):
        return None
    class _GenerativeModel:
        def __init__(self, *args, **kwargs):
            pass
        def generate_content(self, *args, **kwargs):
            return ''
    genai_mod.configure = _configure
    genai_mod.GenerativeModel = _GenerativeModel
    sys.modules['google'] = google_mod
    sys.modules['google.genai'] = genai_mod
    # Ensure `from google import genai` works by setting attribute on the google module
    setattr(sys.modules['google'], 'genai', sys.modules['google.genai'])
    # Also provide `google.generative` package with `genai` attribute used in code
    generative_mod = types.ModuleType('google.generative')
    setattr(generative_mod, 'genai', sys.modules['google.genai'])
    sys.modules['google.generative'] = generative_mod

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
