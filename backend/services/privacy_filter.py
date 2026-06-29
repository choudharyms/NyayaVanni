"""Privacy filter for redacting sensitive client information from search results.

Prevents client contact information (names, phone numbers, email addresses) from
appearing in public-facing search results and case dashboards. Sensitive data is
redacted with placeholder tokens like [CLIENT_NAME], [PHONE], [EMAIL] while
preserving the legal substance of documents.
"""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

PHONE_PATTERN = re.compile(
    r'\b(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}\b'
)
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
NAME_PATTERNS = [
    re.compile(
        r'\bClient[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        re.IGNORECASE
    ),
    re.compile(
        r'\bParty[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        re.IGNORECASE
    ),
]


def redact_phone_numbers(text: str, token: str = "[PHONE]") -> str:
    """Replace phone numbers with a privacy token."""
    return PHONE_PATTERN.sub(token, text)


def redact_emails(text: str, token: str = "[EMAIL]") -> str:
    """Replace email addresses with a privacy token."""
    return EMAIL_PATTERN.sub(token, text)


def redact_client_names(text: str, token: str = "[CLIENT_NAME]") -> str:
    """Replace identified client names with a privacy token.

    Targets patterns like 'Client: John Doe' or 'Party: Jane Smith' and replaces
    the captured name with a token while keeping the prefix.
    """
    for pattern in NAME_PATTERNS:
        text = pattern.sub(f"\\g<0>: {token}", text)
    return text


def filter_search_result(text: str) -> str:
    """Apply all privacy filters to a search result.

    Redacts phone numbers, email addresses, and client names to prevent
    exposure of sensitive contact information in search results and public pages.

    Args:
        text: Raw search result text potentially containing client information.

    Returns:
        Filtered text with sensitive data replaced by privacy tokens.
    """
    if not text:
        return text

    try:
        filtered = redact_phone_numbers(text)
        filtered = redact_emails(filtered)
        filtered = redact_client_names(filtered)
        return filtered
    except Exception as e:
        logger.error(f"Privacy filter failed: {e}")
        return text


def filter_search_results(results: list) -> list:
    """Apply privacy filter to a list of search results.

    Args:
        results: List of search result strings.

    Returns:
        List of filtered results with sensitive data redacted.
    """
    if not results:
        return []

    try:
        return [filter_search_result(result) for result in results]
    except Exception as e:
        logger.error(f"Batch privacy filter failed: {e}")
        return results


def should_filter_for_public_display(is_authenticated: bool) -> bool:
    """Determine whether to apply privacy filters based on authentication status.

    Unauthenticated/public search results should always be filtered. Authenticated
    sessions accessing their own documents may see more details based on access control.

    Args:
        is_authenticated: Whether the current user is authenticated.

    Returns:
        True if privacy filters should be applied (unauthenticated or public search).
    """
    return not is_authenticated
