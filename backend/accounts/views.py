import logging
import secrets
from datetime import timedelta
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import EmailMultiAlternatives
from django.http import HttpResponseRedirect
from django.middleware.csrf import CsrfViewMiddleware, get_token
from django.utils import timezone
from django.views.decorators.csrf import csrf_protect
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .authentication import CookieJWTAuthentication
from .models import CustomUser, EmailChangeRequest, OTPCode, PasswordResetToken, Profile, Zone, Notification, UserRole
from .serializers import LoginSerializer, NotificationSerializer, ProfileSerializer, SignupSerializer, ZoneSerializer

logger = logging.getLogger(__name__)
from .throttles import AuthRateThrottle, OTPRateThrottle


def _set_auth_cookies(response, user):
    refresh = RefreshToken.for_user(user)
    secure = not settings.DEBUG
    samesite = "Lax" if settings.DEBUG else "None"
    response.set_cookie("access_token", str(refresh.access_token), httponly=True, secure=secure, samesite=samesite, max_age=900, path="/")
    response.set_cookie("refresh_token", str(refresh), httponly=True, secure=secure, samesite=samesite, max_age=7 * 86400, path="/")


def _expire_cookie(response, key, *, secure, samesite, path="/"):
    # response.delete_cookie() only marks the *deletion* cookie Secure when
    # you pass samesite="None" — it has no way to express "Secure, but
    # SameSite=Lax" (which is exactly how google_oauth_state is issued in
    # production). And a Set-Cookie without Secure can never modify or
    # clear a cookie that's already Secure — browsers silently ignore the
    # attempt (RFC 6265bis, "Leave Secure Cookies Alone"). That silent
    # failure is why logout, account deletion, and password-reset cleanup
    # weren't actually clearing cookies in production: the deletion request
    # succeeded and said so, but the browser just kept the old cookie.
    #
    # Building the expiring Set-Cookie by hand with attributes that exactly
    # match how the cookie was originally issued sidesteps that entirely.
    response.set_cookie(
        key, "", max_age=0, expires="Thu, 01 Jan 1970 00:00:00 GMT",
        path=path, secure=secure, samesite=samesite, httponly=True,
    )


def _clear_auth_cookies(response):
    secure = not settings.DEBUG
    samesite = "Lax" if settings.DEBUG else "None"
    _expire_cookie(response, "access_token", secure=secure, samesite=samesite)
    _expire_cookie(response, "refresh_token", secure=secure, samesite=samesite)



# DRF's @api_view marks every view function `csrf_exempt` (that's how it lets
# session-less API clients through Django's normal CsrfViewMiddleware), so we
# have to enforce CSRF ourselves for the cookie-authenticated endpoints below.
#
# The previous version of this check compared the `X-CSRFToken` header
# directly against the `csrftoken` cookie with `secrets.compare_digest`. That
# can never actually match: Django's `get_token()` returns a freshly-*masked*
# token every time it's called, while the cookie holds the raw, unmasked
# secret it was masked from — they're different strings by design. Comparing
# them for equality fails every single time outside DEBUG (where this check
# was simply skipped), which is exactly why signup/login/logout/etc. only
# ever worked locally and 403'd with "security token expired" once deployed.
#
# Reusing Django's own CsrfViewMiddleware gives us the real, version-stable
# masked-token comparison (plus Origin/Referer checks against
# CSRF_TRUSTED_ORIGINS) instead of reimplementing — and getting wrong — that
# logic by hand.
_csrf_middleware = CsrfViewMiddleware(lambda request: None)


def _csrf_ok(request):
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return True
    return _csrf_middleware.process_view(request, None, (), {}) is None


def _csrf_error():
    return Response({"success": False, "error": "Your security token expired. Refresh the page and try again."}, status=403)


@api_view(["POST"])
@permission_classes([AllowAny])
def refresh(request):
    """Exchange a valid refresh_token cookie for a new access_token cookie.

    Without this endpoint, sessions silently died 15 minutes after login —
    the refresh_token cookie was issued but nothing ever used it.
    """
    if not _csrf_ok(request):
        return _csrf_error()
    raw = request.COOKIES.get("refresh_token")
    if not raw:
        return Response({"success": False, "error": "Your session has expired. Please sign in again."}, status=401)
    try:
        old_token = RefreshToken(raw)
        user = CustomUser.objects.filter(pk=old_token["user_id"], is_active=True).first()
        if not user:
            raise TokenError("User no longer exists or is inactive.")
    except TokenError:
        response = Response({"success": False, "error": "Your session has expired. Please sign in again."}, status=401)
        _clear_auth_cookies(response)
        return response

    response = Response({"success": True, "message": "Session refreshed."})
    _set_auth_cookies(response, user)
    if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS") and settings.SIMPLE_JWT.get("BLACKLIST_AFTER_ROTATION"):
        try:
            old_token.blacklist()
        except Exception:
            pass
    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request):
    # get_token() both returns the masked token for the response body AND
    # flags Django's own CsrfViewMiddleware to (re)issue the `csrftoken`
    # cookie on the way out, using CSRF_COOKIE_SECURE/CSRF_COOKIE_SAMESITE
    # from settings.
    #
    # Do NOT also call response.set_cookie("csrftoken", token, ...) here —
    # `token` is the *masked* value meant for the request header, not the raw
    # secret Django expects to find in the cookie. Setting the cookie to it
    # only "worked" the very first time a browser hit this endpoint (when
    # CsrfViewMiddleware's own cookie-write ran afterwards and clobbered the
    # wrong value with the right one). Every later call — once a valid
    # cookie already existed — skipped that middleware rewrite, leaving the
    # cookie permanently holding a masked token instead of a secret. Every
    # CSRF check after that point failed, which is exactly the intermittent
    # "security token expired" error.
    token = get_token(request)
    return Response({"success": True, "data": {"csrfToken": token}})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def signup(request):
    if not _csrf_ok(request): return _csrf_error()
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    response = Response({"success": True, "message": "Your account is ready.", "data": {"user": {"id": str(user.id), "email": user.email}}}, status=status.HTTP_201_CREATED)
    _set_auth_cookies(response, user)
    return response


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def login(request):
    if not _csrf_ok(request): return _csrf_error()
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    response = Response({"success": True, "message": "Welcome back.", "data": {"user": {"id": str(user.id), "email": user.email}}})
    _set_auth_cookies(response, user)
    return response


@api_view(["POST"])
@permission_classes([AllowAny])
def logout(request):
    if not _csrf_ok(request): return _csrf_error()
    response = Response({"success": True, "message": "You have been signed out."})
    _clear_auth_cookies(response)
    return response


def _signed_avatar(path):
    if not path or not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None
    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        result = client.storage.from_(settings.SUPABASE_AVATAR_BUCKET).create_signed_url(path, 3600)
        return result.get("signedURL") or result.get("signedUrl") if isinstance(result, dict) else None
    except Exception:
        return None


@api_view(["GET"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    profile, _ = Profile.objects.get_or_create(user=request.user, defaults={"username": request.user.email.split("@")[0], "display_name": request.user.email.split("@")[0]})
    profile_data = ProfileSerializer(profile).data
    profile_data["avatar_url"] = _signed_avatar(profile.avatar_path)
    return Response({"success": True, "data": {"user": {"id": str(request.user.id), "email": request.user.email}, "profile": profile_data}})


@api_view(["PATCH"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def update_profile(request):
    if not _csrf_ok(request): return _csrf_error()
    profile, _ = Profile.objects.get_or_create(user=request.user)
    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"success": True, "data": {"profile": serializer.data}})


@api_view(["POST"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def change_email(request):
    if not _csrf_ok(request): return _csrf_error()
    email = str(request.data.get("email", "")).strip().lower()
    if "@" not in email or len(email) > 255:
        return Response({"success": False, "error": "Enter a valid email address."}, status=400)
    if email == request.user.email:
        return Response({"success": False, "error": "That's already your email address."}, status=400)
    if CustomUser.objects.exclude(pk=request.user.pk).filter(email=email).exists():
        return Response({"success": False, "error": "That email address is already in use."}, status=409)

    # Double opt-in: nothing on CustomUser changes yet. A confirmation link
    # goes to the *new* address — only clicking it (see confirm_email_change
    # below) actually updates the account. A separate heads-up goes to the
    # *current* address so that if someone else with access to this session
    # requested the change, the real owner finds out immediately.
    EmailChangeRequest.objects.filter(user=request.user, used=False).update(used=True)
    raw_token = secrets.token_urlsafe(32)
    EmailChangeRequest.objects.create(
        user=request.user, new_email=email, token=raw_token,
        expires_at=timezone.now() + timedelta(minutes=30),
    )
    confirm_url = f"{settings.FRONTEND_URL}/confirm-email?token={raw_token}"
    old_email = request.user.email

    try:
        confirm_msg = EmailMultiAlternatives(
            "Confirm your new FarmPulse email address",
            f"Confirm your new FarmPulse email address by visiting this link:\n{confirm_url}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.",
            settings.DEFAULT_FROM_EMAIL, [email],
        )
        confirm_msg.attach_alternative(
            f'<p>Confirm your new FarmPulse email address:</p>'
            f'<p><a href="{confirm_url}">{confirm_url}</a></p>'
            f'<p>This link expires in 30 minutes. If you didn\'t request this, you can ignore this email.</p>',
            "text/html",
        )
        confirm_msg.send(fail_silently=False)

        notice_msg = EmailMultiAlternatives(
            "Your FarmPulse email address is changing",
            f"A request was made to change the email on your FarmPulse account to {email}.\n\n"
            f"If this was you, no action is needed — the change won't take effect until that new address confirms it.\n"
            f"If this wasn't you, sign in and change your password right away.",
            settings.DEFAULT_FROM_EMAIL, [old_email],
        )
        notice_msg.send(fail_silently=False)
    except Exception:
        # Same principle as the OTP endpoint: don't tell the browser the
        # email went out if we know it didn't. The pending request row
        # above is still valid, so a retry from settings will just issue a
        # fresh token rather than leaving a dangling unconfirmable one.
        logger.exception("Failed to send email-change confirmation for user %s", request.user.pk)
        return Response(
            {"success": False, "error": "Couldn't send the confirmation email right now. Please try again in a moment."},
            status=502,
        )

    return Response({
        "success": True,
        "message": f"Check {email} for a link to confirm the change. We've also sent a notice to your current address.",
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def confirm_email_change(request):
    # Deliberately AllowAny, same reasoning as confirm_password_reset below:
    # the person confirming may be opening this link from a different
    # device/session than the one that requested the change (e.g. checking
    # the new email on their phone). The token itself — single-use,
    # time-limited, ~256 bits of entropy, tied server-side to one specific
    # account — is the actual authorization, not the caller's own session.
    if not _csrf_ok(request): return _csrf_error()
    token = str(request.data.get("token", "")).strip()
    if not token:
        return Response({"success": False, "error": "Missing confirmation token."}, status=400)

    change = EmailChangeRequest.objects.filter(token=token, used=False).first()
    if not change or change.expires_at <= timezone.now():
        return Response({"success": False, "error": "That confirmation link is invalid or has expired."}, status=400)

    # The new address could have been claimed by someone else in the window
    # between the request and the click — re-check right before committing.
    if CustomUser.objects.exclude(pk=change.user_id).filter(email=change.new_email).exists():
        change.used = True
        change.save(update_fields=["used"])
        return Response({"success": False, "error": "That email address was taken before this link was confirmed."}, status=409)

    change.used = True
    change.save(update_fields=["used"])
    user = change.user
    user.email = change.new_email
    user.save(update_fields=["email"])
    return Response({"success": True, "message": "Your email address has been updated.", "data": {"email": user.email}})


@api_view(["POST"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def change_password(request):
    if not _csrf_ok(request): return _csrf_error()
    password = request.data.get("password", "")
    if not isinstance(password, str) or not 8 <= len(password) <= 72:
        return Response({"success": False, "error": "Use a password between 8 and 72 characters."}, status=400)
    request.user.set_password(password)
    request.user.save(update_fields=["password"])
    return Response({"success": True, "message": "Password changed successfully."})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([OTPRateThrottle])
def request_otp(request):
    if not _csrf_ok(request): return _csrf_error()
    email = str(request.data.get("email", "")).strip().lower()
    user = CustomUser.objects.filter(email=email, is_active=True).first()
    # Generic response prevents account enumeration.
    if user:
        code = f"{secrets.randbelow(1_000_000):06d}"
        OTPCode.objects.filter(email=email, used=False).update(used=True)
        OTPCode.objects.create(user=user, email=email, hashed_code=make_password(code), expires_at=timezone.now() + timedelta(minutes=10))
        subject = "Your FarmPulse verification code"
        text = f"Your FarmPulse verification code is {code}. It expires in 10 minutes."
        html = f"<p>Your FarmPulse verification code is <strong>{code}</strong>.</p><p>This code expires in 10 minutes.</p>"
        msg = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [email])
        msg.attach_alternative(html, "text/html")
        try:
            msg.send(fail_silently=False)
        except Exception:
            # The OTP row above is already committed, so the code is valid
            # even if we couldn't confirm delivery — but we do NOT want to
            # tell the browser "sent" when we know it wasn't (that just
            # turns "the email never arrives" into a mystery). Log for
            # operators and be honest with the client; this also keeps a
            # broken/misconfigured mail server (or one Render is blocking
            # outbound to) from ever hanging the request past Gunicorn's
            # worker timeout — see the EMAIL_TIMEOUT comment in settings.py.
            logger.exception("Failed to send OTP email to %s", email)
            return Response(
                {"success": False, "error": "Couldn't send the verification email right now. Please try again in a moment."},
                status=502,
            )
    return Response({"success": True, "message": "If an account matches that email, a verification code has been sent."})


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    if not _csrf_ok(request): return _csrf_error()
    email = str(request.data.get("email", "")).strip().lower()
    code = str(request.data.get("code", "")).strip()
    otp = OTPCode.objects.filter(email=email, used=False).order_by("-created_at").first()
    if not otp or otp.expires_at <= timezone.now() or otp.attempts >= otp.max_attempts:
        return Response({"success": False, "error": "That code is invalid or has expired."}, status=400)
    otp.attempts += 1
    if not check_password(code, otp.hashed_code):
        otp.save(update_fields=["attempts"])
        return Response({"success": False, "error": "That verification code is incorrect."}, status=400)
    otp.used = True
    otp.save(update_fields=["attempts", "used"])
    raw = secrets.token_urlsafe(32)
    PasswordResetToken.objects.filter(user=otp.user, used=False).update(used=True)
    PasswordResetToken.objects.create(user=otp.user, hashed_token=make_password(raw), expires_at=timezone.now() + timedelta(minutes=10))
    response = Response({"success": True, "message": "Code verified. You can choose a new password."})
    response.set_cookie("pw_reset", raw, httponly=True, secure=not settings.DEBUG, samesite=("Lax" if settings.DEBUG else "None"), max_age=600, path="/")
    return response


@api_view(["POST"])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    if not _csrf_ok(request): return _csrf_error()
    password = str(request.data.get("password", ""))
    if not 8 <= len(password) <= 72:
        return Response({"success": False, "error": "Use a password between 8 and 72 characters."}, status=400)
    raw = request.COOKIES.get("pw_reset")
    token = None
    if raw:
        # Match against the specific token this cookie belongs to, not just
        # whichever row happens to be newest — with concurrent resets across
        # different accounts, "newest" and "the requester's own token" aren't
        # the same row, and the requester's still-valid token was being
        # rejected as "expired" purely because someone else reset later.
        candidates = PasswordResetToken.objects.filter(used=False, expires_at__gt=timezone.now()).order_by("-created_at")
        for candidate in candidates:
            if check_password(raw, candidate.hashed_token):
                token = candidate
                break
    if not raw or not token:
        return Response({"success": False, "error": "Your reset session has expired. Request a new code."}, status=400)
    token.user.set_password(password)
    token.user.save(update_fields=["password"])
    token.used = True
    token.save(update_fields=["used"])
    response = Response({"success": True, "message": "Your password has been reset. You can sign in now."})
    _expire_cookie(response, "pw_reset", secure=not settings.DEBUG, samesite=("Lax" if settings.DEBUG else "None"))
    return response


@api_view(["GET"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def zones(request):
    return Response({"success": True, "data": {"zones": ZoneSerializer(Zone.objects.filter(user=request.user).order_by("created_at"), many=True).data}})


@api_view(["POST"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def create_zone(request):
    if not _csrf_ok(request): return _csrf_error()
    serializer = ZoneSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    zone = serializer.save(user=request.user)
    return Response({"success": True, "data": {"zone": ZoneSerializer(zone).data}}, status=201)


@api_view(["DELETE"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_zone(request, zone_id):
    if not _csrf_ok(request): return _csrf_error()
    Zone.objects.filter(id=zone_id, user=request.user).delete()
    return Response({"success": True, "message": "Zone removed."})


@api_view(["GET"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def notifications(request):
    rows = Notification.objects.filter(user=request.user).order_by("-created_at")[:30]
    return Response({"success": True, "data": {"notifications": NotificationSerializer(rows, many=True).data}})


@api_view(["PATCH"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    if not _csrf_ok(request): return _csrf_error()
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({"success": True})


@api_view(["POST"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_account(request):
    if not _csrf_ok(request): return _csrf_error()
    request.user.delete()
    response = Response({"success": True, "message": "Your account has been deleted."})
    _clear_auth_cookies(response)
    return response


@api_view(["POST"])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    if not _csrf_ok(request): return _csrf_error()
    image = request.FILES.get("file")
    if not image or image.size > 5 * 1024 * 1024:
        return Response({"success": False, "error": "Choose an image under 5MB."}, status=400)
    if not image.content_type.startswith("image/"):
        return Response({"success": False, "error": "Only image files are supported."}, status=400)
    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        path = f"{request.user.id}/avatar-{secrets.token_hex(8)}"
        client.storage.from_(settings.SUPABASE_AVATAR_BUCKET).upload(path, image.read(), {"content-type": image.content_type, "upsert": "true"})
        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.avatar_path = path
        profile.save(update_fields=["avatar_path", "updated_at"])
        signed = client.storage.from_(settings.SUPABASE_AVATAR_BUCKET).create_signed_url(path, 3600)
        url = signed.get("signedURL") or signed.get("signedUrl") if isinstance(signed, dict) else None
        return Response({"success": True, "data": {"avatarUrl": url, "path": path}})
    except Exception:
        return Response({"success": False, "error": "Photo upload is unavailable right now."}, status=502)


def google_start(request):
    state = secrets.token_urlsafe(24)
    callback = settings.GOOGLE_OAUTH_CALLBACK_URL
    params = {"client_id": settings.GOOGLE_OAUTH_CLIENT_ID, "redirect_uri": callback, "response_type": "code", "scope": "openid email profile", "access_type": "offline", "prompt": "select_account", "state": state}
    response = HttpResponseRedirect("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params))
    response.set_cookie("google_oauth_state", state, httponly=True, secure=not settings.DEBUG, samesite="Lax", max_age=600, path="/")
    return response


def google_callback(request):
    state = request.GET.get("state")
    if not state or state != request.COOKIES.get("google_oauth_state"):
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=google_state")
    code = request.GET.get("code")
    if not code:
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=google_denied")
    token = requests.post("https://oauth2.googleapis.com/token", data={"code": code, "client_id": settings.GOOGLE_OAUTH_CLIENT_ID, "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET, "redirect_uri": settings.GOOGLE_OAUTH_CALLBACK_URL, "grant_type": "authorization_code"}, timeout=10)
    if not token.ok:
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=google_token")
    access = token.json().get("access_token")
    info = requests.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {access}"}, timeout=10)
    if not info.ok:
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=google_profile")
    data = info.json()
    email = str(data.get("email", "")).lower().strip()
    if not email:
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=google_email")
    user, created = CustomUser.objects.get_or_create(email=email, defaults={"is_active": True})
    if created:
        Profile.objects.create(user=user, username=(data.get("name") or email.split("@")[0])[:40], display_name=(data.get("name") or email.split("@")[0])[:60])
        UserRole.objects.create(user=user, role="user")
    response = HttpResponseRedirect(f"{settings.FRONTEND_URL}/dashboard")
    _set_auth_cookies(response, user)
    _expire_cookie(response, "google_oauth_state", secure=not settings.DEBUG, samesite="Lax")
    return response