import re
from datetime import datetime


DATE_PATTERNS = [
    (r"\b\d{2}/\d{2}/\d{4}\b", "DD/MM/YYYY"),
    (r"\b\d{4}-\d{2}-\d{2}\b", "YYYY-MM-DD"),
    (r"\b\d{2}-\d{2}-\d{4}\b", "DD-MM-YYYY"),
    (r"\b\d{2}\.\d{2}\.\d{4}\b", "DD.MM.YYYY"),
    (
        r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
        r"Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
        r"\s+\d{1,2},?\s+\d{4}\b",
        "Month DD, YYYY",
    ),
    (
        r"\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|"
        r"May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|"
        r"Dec(?:ember)?)\s+\d{4}\b",
        "DD Month YYYY",
    ),
]


def extract_dates(text: str) -> list[dict]:
    found = []
    seen = set()
    for pattern, label in DATE_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            raw = match.group()
            if raw in seen:
                continue
            seen.add(raw)
            start = max(0, match.start() - 40)
            end = min(len(text), match.end() + 40)
            context = text[start:end].strip()
            found.append({
                "date": raw,
                "format": label,
                "context": context,
            })
    found.sort(key=lambda x: x["date"])
    return found
