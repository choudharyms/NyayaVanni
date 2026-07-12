import os

GLOBAL_RATE_LIMIT = os.getenv("GLOBAL_RATE_LIMIT", "100/hour")

UPLOAD_RATE_LIMIT = os.getenv("UPLOAD_RATE_LIMIT", "10/minute")

ANALYZE_RATE_LIMIT = os.getenv("ANALYZE_RATE_LIMIT", "5/minute")

CHAT_RATE_LIMIT = os.getenv("CHAT_RATE_LIMIT", "20/minute")

GENERAL_CHAT_RATE_LIMIT = os.getenv("GENERAL_CHAT_RATE_LIMIT", "30/minute")

CONTACT_RATE_LIMIT = os.getenv("CONTACT_RATE_LIMIT", "3/minute")

DELETE_RATE_LIMIT = os.getenv("DELETE_RATE_LIMIT", "10/minute")

SEARCH_RATE_LIMIT = os.getenv("SEARCH_RATE_LIMIT", "30/minute")
