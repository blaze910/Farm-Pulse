from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        raw = request.COOKIES.get("access_token")
        if not raw:
            header = request.headers.get("Authorization", "")
            if header.startswith("Bearer "):
                raw = header[7:].strip()
        if not raw:
            return None
        jwt_auth = JWTAuthentication()
        validated = jwt_auth.get_validated_token(raw)
        user = jwt_auth.get_user(validated)
        if not user or not user.is_active:
            raise AuthenticationFailed("Your session is no longer active. Please sign in again.")
        return user, validated
