from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import CustomUser, Profile, Zone, Notification


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(min_length=8, max_length=72, write_only=True)
    username = serializers.CharField(max_length=40, required=False, allow_blank=True)

    def validate_password(self, value):
        # min_length=8 above is just a raw character-count check — this is
        # what actually runs the AUTH_PASSWORD_VALIDATORS chain from
        # settings.py (rejects common/leaked passwords, all-numeric ones,
        # and ones too similar to the account's own email), so something
        # like "password" or "12345678" — 8+ characters, but not remotely
        # strong — gets caught here instead of sailing through.
        temp_user = CustomUser(email=str(self.initial_data.get("email", "")).strip().lower())
        try:
            validate_password(value, user=temp_user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        email = validated_data["email"].lower().strip()
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "An account with this email already exists."})
        user = CustomUser.objects.create_user(email, validated_data["password"])
        Profile.objects.create(
            user=user,
            username=validated_data.get("username", "").strip() or email.split("@")[0],
            display_name=validated_data.get("username", "").strip() or email.split("@")[0],
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"].lower().strip(), password=attrs["password"])
        if not user:
            raise serializers.ValidationError("The email or password is incorrect.")
        attrs["user"] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    avatar_url = serializers.CharField(source="avatar_path", allow_null=True, required=False)

    class Meta:
        model = Profile
        fields = [
            "email", "username", "display_name", "avatar_url",
            "pest_alerts", "weekly_digest",
            "onboarded", "subscribed", "subscribe_reminder_at",
        ]


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ["id", "name", "region", "lat", "lon", "hectares", "crop", "created_at"]
        read_only_fields = ["id", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "kind", "read", "created_at"]
