"""Django settings for the FarmPulse backend."""
import os
from pathlib import Path
from datetime import timedelta

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", os.environ.get("SECRET_KEY", "dev-insecure-secret-key"))
# Defaults OFF. Falling back to "1" here would mean a deploy that simply
# forgets to set DEBUG=0 silently ships with debug pages (full tracebacks,
# settings, SQL) exposed to the internet, and our SESSION_COOKIE_SECURE /
# CSRF_COOKIE_SECURE settings below would quietly downgrade to insecure
# cookies too. Explicit opt-in for local development instead: run with
# DEBUG=1 in your .env.
DEBUG = os.environ.get("DEBUG", "0") == "1"
_allowed = os.environ.get("ALLOWED_HOSTS", "*")
ALLOWED_HOSTS = ["*"] if _allowed.strip() == "*" else [x.strip() for x in _allowed.split(",") if x.strip()]

# Render (and most PaaS hosts) terminate TLS at a reverse proxy and forward
# requests to the app over plain HTTP with an X-Forwarded-Proto header
# indicating the original scheme. Without this, Django's request.is_secure()
# always returns False, which weakens CsrfViewMiddleware's HTTPS-only
# Referer/Origin checks and makes request.build_absolute_uri() (used to
# build the Google OAuth callback URL) emit http:// links in production.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes", "django.contrib.sessions",
    "django.contrib.staticfiles", "django.contrib.messages",
    "rest_framework", "rest_framework_simplejwt.token_blacklist", "corsheaders", "accounts", "agro",
]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", "django.middleware.security.SecurityMiddleware", "whitenoise.middleware.WhiteNoiseMiddleware", "django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.common.CommonMiddleware", "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware", "django.contrib.messages.middleware.MessageMiddleware"]
ROOT_URLCONF = "config.urls"
TEMPLATES = [{"BACKEND":"django.template.backends.django.DjangoTemplates","DIRS":[],"APP_DIRS":True,"OPTIONS":{"context_processors":["django.template.context_processors.request","django.contrib.auth.context_processors.auth","django.contrib.messages.context_processors.messages"]}}]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres"):
    import urllib.parse
    parsed = urllib.parse.urlparse(DATABASE_URL)
    DATABASES = {"default": {"ENGINE":"django.db.backends.postgresql","NAME":parsed.path.lstrip("/"),"USER":parsed.username,"PASSWORD":parsed.password,"HOST":parsed.hostname,"PORT":parsed.port or 5432,"OPTIONS":{"sslmode":"require"}}}
else:
    DATABASES = {"default": {"ENGINE":"django.db.backends.sqlite3","NAME":BASE_DIR / "db.sqlite3"}}

AUTH_USER_MODEL = "accounts.CustomUser"
# Was an empty list — Django's built-in checks (minimum length, not a
# common/leaked password, not all-numeric, not too similar to the user's
# own email) were entirely switched off. Only the signup form's
# min_length=8 was actually doing anything, meaning "password" or
# "12345678" both passed. Re-enabling these is the actual fix — this list
# is what Django ships by default and most Django apps run unmodified.
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STORAGES = {
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {"DEFAULT_RENDERER_CLASSES":["rest_framework.renderers.JSONRenderer"],"DEFAULT_PERMISSION_CLASSES":["rest_framework.permissions.AllowAny"],"DEFAULT_AUTHENTICATION_CLASSES":["accounts.authentication.CookieJWTAuthentication"],"DEFAULT_THROTTLE_RATES":{"auth":"5/min","otp":"3/min"}}
SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME":timedelta(minutes=int(os.environ.get("JWT_ACCESS_MINUTES","15"))),"REFRESH_TOKEN_LIFETIME":timedelta(days=int(os.environ.get("JWT_REFRESH_DAYS","7"))),"ROTATE_REFRESH_TOKENS":True,"BLACKLIST_AFTER_ROTATION":True,"AUTH_HEADER_TYPES":("Bearer",)}

_cors = os.environ.get("CORS_ALLOWED_ORIGINS", os.environ.get("FRONTEND_URL", "http://localhost:3000"))
CORS_ALLOWED_ORIGINS = [x.strip() for x in _cors.split(",") if x.strip()]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
CORS_ALLOW_CREDENTIALS = True

# The frontend (Vercel) and backend (Render) live on different domains, so the
# access/refresh/CSRF cookies are cross-site. Cross-site cookies are only sent
# by browsers when SameSite=None *and* Secure — both are required together,
# never one without the other. Locally, frontend/backend run on http on
# different ports, so we fall back to Lax + non-secure (Secure cookies are
# dropped entirely over plain http).
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]


FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
GOOGLE_OAUTH_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "")
GOOGLE_OAUTH_CALLBACK_URL = os.environ.get("GOOGLE_OAUTH_CALLBACK_URL", "http://localhost:8000/api/v1/accounts/oauth/google/callback/")
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "1") == "1"
# Django's SMTP backend has NO timeout by default — a slow/unreachable/
# misconfigured SMTP host (or a host whose outbound port is blocked, which
# some PaaS free tiers do) can hang the connection attempt far past
# Gunicorn's own worker timeout. When that happens Gunicorn kills the
# worker mid-request with no HTTP response sent at all, which browsers
# report as a bare "Failed to fetch" — not a clean error message, just a
# dead connection. Capping this well under Gunicorn's timeout means a
# broken mail config fails fast with a real error instead of hanging the
# whole request.
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", "10"))
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "no-reply@farmpulse.local")

# Render's free tier blocks all outbound SMTP (ports 25/465/587) as of
# September 2025 to prevent spam abuse — the EMAIL_HOST/SMTP settings above
# just hang until they hit EMAIL_TIMEOUT there, every time, regardless of
# how correct the credentials are. When this is set, accounts/emailing.py
# sends over Resend's HTTPS API instead (port 443, unaffected by that
# block) and only falls back to the SMTP settings above when this is
# blank — which keeps local dev simple (no API key needed, just uses the
# console backend as before) while actually working in production.
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")

# Separate sender addresses for different email categories — a support@
# reply-to matters most for the email-change flow specifically, since
# that's the one where a confused/suspicious recipient is most likely to
# want to actually respond to someone. no-reply@ (DEFAULT_FROM_EMAIL,
# above) stays the default for everything else. alerts@ is reserved for
# triggered pest-risk notification emails — that feature doesn't exist yet
# (the pest risk model and the "Alerts" opt-in checkbox in the UI both
# exist, but nothing currently sends a triggered email when risk changes),
# this just makes the address ready to use once it's built.
EMAIL_FROM_SUPPORT = os.environ.get("EMAIL_FROM_SUPPORT", "support@farmpulse.name.ng")
EMAIL_FROM_ALERTS = os.environ.get("EMAIL_FROM_ALERTS", "alerts@farmpulse.name.ng")

# Inbound email (support@ replies), via Resend's webhook. RESEND_WEBHOOK_SECRET
# comes from Resend's dashboard when you create the webhook subscription
# (starts with "whsec_") — used to verify each delivery is genuinely from
# Resend, not a spoofed POST to a guessable URL. SUPPORT_FORWARD_TO_EMAIL is
# whichever personal inbox should get a copy of every support message.
RESEND_WEBHOOK_SECRET = os.environ.get("RESEND_WEBHOOK_SECRET", "")
SUPPORT_FORWARD_TO_EMAIL = os.environ.get("SUPPORT_FORWARD_TO_EMAIL", "")
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend" if EMAIL_HOST else "django.core.mail.backends.console.EmailBackend"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_AVATAR_BUCKET = os.environ.get("SUPABASE_AVATAR_BUCKET", "avatars")
MARKET_API_URL = os.environ.get("MARKET_API_URL") or None
MARKET_API_KEY = os.environ.get("MARKET_API_KEY") or None
