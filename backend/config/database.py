import os

DB_TIMEOUT_SECONDS = int(os.getenv("DB_TIMEOUT_SECONDS", "30"))
DB_POOL_MAX_SIZE = int(os.getenv("DB_POOL_MAX_SIZE", "10"))
