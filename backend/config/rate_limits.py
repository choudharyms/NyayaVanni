import os

GLOBAL_RATE_LIMIT = os.getenv("GLOBAL_RATE_LIMIT", "100/hour")

UPLOAD_RATE_LIMIT = os.getenv("UPLOAD_RATE_LIMIT", "10/minute")

ANALYZE_RATE_LIMIT = os.getenv("ANALYZE_RATE_LIMIT", "5/minute")

CHAT_RATE_LIMIT = os.getenv("CHAT_RATE_LIMIT", "20/minute")

GENERAL_CHAT_RATE_LIMIT = os.getenv("GENERAL_CHAT_RATE_LIMIT", "30/minute")