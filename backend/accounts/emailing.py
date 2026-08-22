"""Shared transactional-email sending, used by OTP requests and the
email-change confirmation flow.

Render's free tier blocks all outbound SMTP (ports 25/465/587) as of
September 2025. Any attempt to send via Django's normal SMTP EMAIL_BACKEND
from there just hangs until EMAIL_TIMEOUT, every single time — it's not a
credentials or code problem, it's a network-level block on the platform.

Resend's API runs over plain HTTPS (port 443), which isn't affected, so
that's what this uses in production. Locally, RESEND_API_KEY is normally
unset, so this quietly falls back to Django's configured EMAIL_BACKEND
(the console backend by default) — no API key needed just to test a flow
on your own machine.
"""
from django.conf import settings
from django.core.mail import EmailMultiAlternatives


def send_email(*, subject: str, text: str, html: str, to: str, from_email: str | None = None) -> None:
    """Send one transactional email. Raises on failure either way — callers
    are expected to catch this and turn it into a clean error response
    (see request_otp / change_email in views.py) rather than let a 500
    propagate from a dependency the caller can't control.

    from_email lets callers pick which of the verified addresses on the
    domain a given email comes from (e.g. no-reply@ for OTP codes vs
    support@ for account-change confirmations) — defaults to
    DEFAULT_FROM_EMAIL when not given. Resend doesn't need any extra setup
    per address beyond the domain itself being verified; any address
    @that domain works as a sender automatically.
    """
    sender = from_email or settings.DEFAULT_FROM_EMAIL
    if settings.RESEND_API_KEY:
        import resend

        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": sender,
            "to": [to],
            "subject": subject,
            "html": html,
            "text": text,
        })
        return

    msg = EmailMultiAlternatives(subject, text, sender, [to])
    msg.attach_alternative(html, "text/html")
    msg.send(fail_silently=False)
