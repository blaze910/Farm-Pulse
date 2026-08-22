"""Resend inbound-email webhook: receives support@ replies, verifies the
delivery is genuinely from Resend (Svix's HMAC scheme), stores the message,
and forwards a copy to SUPPORT_FORWARD_TO_EMAIL.
"""
import base64
import hashlib
import hmac
import json
import logging
import time

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .emailing import send_email
from .models import SupportMessage

logger = logging.getLogger(__name__)


def _verify_resend_signature(request) -> bool:
    """Verify a Resend webhook delivery using Svix's signing scheme:
    base64(HMAC-SHA256(secret, "{id}.{timestamp}.{raw_body}")), checked
    against one of the (possibly several, space-separated) signatures in
    the svix-signature header. Also rejects deliveries whose timestamp is
    more than 5 minutes off from now, to block replay of a captured
    request.

    Hand-rolled rather than pulled from the resend/svix SDK's own verify
    helper — this is a small, stable, publicly documented algorithm, and
    implementing it directly here means it isn't coupled to a specific SDK
    version's API surface for something this security-sensitive; it's easy
    to audit in one place instead.
    """
    secret = settings.RESEND_WEBHOOK_SECRET
    if not secret:
        return False

    svix_id = request.headers.get("svix-id", "")
    svix_timestamp = request.headers.get("svix-timestamp", "")
    svix_signature = request.headers.get("svix-signature", "")
    if not (svix_id and svix_timestamp and svix_signature):
        return False

    try:
        if abs(time.time() - int(svix_timestamp)) > 300:
            return False
    except ValueError:
        return False

    secret_b64 = secret[len("whsec_"):] if secret.startswith("whsec_") else secret
    try:
        secret_bytes = base64.b64decode(secret_b64)
    except Exception:
        return False

    signed_content = f"{svix_id}.{svix_timestamp}.".encode("utf-8") + request.body
    expected = base64.b64encode(hmac.new(secret_bytes, signed_content, hashlib.sha256).digest()).decode()

    for part in svix_signature.split():
        _, _, sig = part.partition(",")
        if sig and hmac.compare_digest(sig, expected):
            return True
    return False


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_inbound_webhook(request):
    if not _verify_resend_signature(request):
        return Response({"success": False, "error": "Invalid signature."}, status=401)

    try:
        event = json.loads(request.body)
    except ValueError:
        return Response({"success": False, "error": "Invalid payload."}, status=400)

    if event.get("type") != "email.received":
        # Ignore event types we're not handling, but still 200 — Resend
        # retries on non-2xx, and there's nothing here worth retrying.
        return Response({"success": True})

    data = event.get("data") or {}
    email_id = data.get("email_id") or data.get("id")
    if not email_id:
        return Response({"success": True})

    # Idempotency: webhook providers redeliver, especially after a slow
    # response. Without this, a redelivered event would store — and
    # forward — the same message twice.
    if SupportMessage.objects.filter(resend_email_id=email_id).exists():
        return Response({"success": True})

    from_raw = data.get("from")
    from_email = from_raw.get("email", "") if isinstance(from_raw, dict) else str(from_raw or "")
    to_field = data.get("to")
    to_email = ""
    if isinstance(to_field, list) and to_field:
        first = to_field[0]
        to_email = first.get("email", "") if isinstance(first, dict) else str(first)
    subject = data.get("subject", "")

    # The webhook payload itself is metadata only — the actual body needs
    # a separate call to the Receiving API.
    text_body, html_body = "", ""
    try:
        import resend

        resend.api_key = settings.RESEND_API_KEY
        full = resend.Emails.Receiving.get(email_id=email_id)
        text_body = (full or {}).get("text") or ""
        html_body = (full or {}).get("html") or ""
    except Exception:
        logger.exception("Failed to fetch full content for inbound email %s", email_id)

    msg = SupportMessage.objects.create(
        resend_email_id=email_id,
        from_email=from_email,
        to_email=to_email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )

    if settings.SUPPORT_FORWARD_TO_EMAIL:
        try:
            send_email(
                subject=f"[FarmPulse support] {subject or '(no subject)'}",
                text=f"From: {from_email}\n\n{text_body or '(no plain-text body)'}",
                html=f"<p><strong>From:</strong> {from_email}</p>{html_body or f'<pre>{text_body}</pre>'}",
                to=settings.SUPPORT_FORWARD_TO_EMAIL,
                from_email=settings.EMAIL_FROM_SUPPORT,
            )
            msg.forwarded = True
            msg.save(update_fields=["forwarded"])
        except Exception:
            # Already stored above — a failed forward doesn't lose the
            # message, it's still visible in Django admin.
            logger.exception("Failed to forward inbound support email %s", email_id)

    return Response({"success": True})
