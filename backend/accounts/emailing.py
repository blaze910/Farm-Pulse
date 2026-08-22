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
from datetime import datetime

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

# An approximation of the app's OKLCH brand green as a plain hex value —
# email clients (especially Outlook, which renders via Word's engine) have
# no OKLCH support at all, and inconsistent support for most modern CSS in
# general, so this intentionally doesn't try to match the app's CSS
# variable exactly.
_BRAND_GREEN = "#15803d"
_SUPPORT_EMAIL = "support@farmpulse.name.ng"


def wrap_html(inner_html: str) -> str:
    """Wrap a user-facing email's body in a consistent branded shell —
    header, card, and a footer with a support contact + copyright line —
    so every email sent from the app looks like it came from the same
    place, instead of a bare unstyled paragraph.

    Table-based layout with inline styles throughout is deliberate, not an
    oversight: email clients (Outlook above all) strip <style> blocks and
    most CSS layout features entirely, so this is the actual baseline that
    reliably renders across clients, not a stylistic choice.
    """
    year = datetime.now().year
    return f"""<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #e5e5e0;">
            <tr>
              <td style="padding:24px 28px 0 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:{_BRAND_GREEN};width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;font-size:16px;line-height:32px;">🌱</td>
                    <td style="padding-left:10px;font-size:16px;font-weight:700;color:#1a1a18;">FarmPulse</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px 28px;font-size:14px;line-height:1.65;color:#33332f;">
                {inner_html}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid #e5e5e0;font-size:12px;line-height:1.7;color:#7a7a72;">
                Need help? Contact us at <a href="mailto:{_SUPPORT_EMAIL}" style="color:{_BRAND_GREEN};text-decoration:none;">{_SUPPORT_EMAIL}</a><br/>
                © {year} FarmPulse. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def wrap_text(inner_text: str) -> str:
    """Plain-text counterpart to wrap_html — same footer, no markup."""
    year = datetime.now().year
    return f"{inner_text}\n\n---\nNeed help? Contact {_SUPPORT_EMAIL}\n© {year} FarmPulse. All rights reserved."


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
