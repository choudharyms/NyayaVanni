import logging
import os
import smtplib

logger = logging.getLogger(__name__)

# SMTP settings - override via env vars
EMAIL_SMTP_HOST = os.getenv("EMAIL_SMTP_HOST", "localhost")
EMAIL_SMTP_PORT = int(os.getenv("EMAIL_SMTP_PORT", "25"))
EMAIL_SMTP_TIMEOUT = float(os.getenv("EMAIL_SMTP_TIMEOUT", "10"))
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@nyayavanni.in")


def send_email(to: str, subject: str, body: str) -> None:
    """Deliver an email over SMTP with a per-socket-operation timeout.

    Every SMTP socket operation (connect, greeting, send) is bounded by
    ``EMAIL_SMTP_TIMEOUT`` seconds so a hung mail server cannot block the
    caller indefinitely. Callers should additionally wrap this call in a
    hard wall-clock timeout to cover stalls outside the socket layer
    (DNS resolution, TLS handshake, etc.).
    """
    with smtplib.SMTP(
        EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, timeout=EMAIL_SMTP_TIMEOUT
    ) as server:
        message = f"Subject: {subject}\r\n\r\n{body}"
        server.sendmail(EMAIL_FROM, [to], message)
