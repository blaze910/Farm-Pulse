import uuid
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    def __str__(self):
        return self.email


class Profile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True, related_name="profile")
    username = models.CharField(max_length=40, blank=True, null=True)
    display_name = models.CharField(max_length=60, blank=True, null=True)
    avatar_path = models.CharField(max_length=500, blank=True, null=True)
    pest_alerts = models.BooleanField(default=True)
    weekly_digest = models.BooleanField(default=False)
    # Subscription / prompt state.
    # onboarded: False only until the account has seen the first-run dialog.
    onboarded = models.BooleanField(default=False)
    subscribed = models.BooleanField(default=False)
    # When set, the weekly side reminder stays hidden until this moment.
    subscribe_reminder_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class UserRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="roles")
    role = models.CharField(max_length=32, default="user")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "role"], name="unique_user_role")]


class OTPCode(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.CASCADE)
    email = models.EmailField(max_length=255)
    hashed_code = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)
    max_attempts = models.PositiveIntegerField(default=5)
    used = models.BooleanField(default=False)


class PasswordResetToken(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    hashed_token = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)


class Zone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="zones")
    name = models.CharField(max_length=100)
    region = models.CharField(max_length=160, blank=True)
    lat = models.FloatField()
    lon = models.FloatField()
    hectares = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    crop = models.CharField(max_length=40, default="maize")
    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    KIND_CHOICES = [("info", "Info"), ("warning", "Warning"), ("critical", "Critical"), ("digest", "Digest")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=160)
    body = models.TextField()
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default="info")
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
