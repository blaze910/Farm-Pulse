from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Profile, UserRole, OTPCode, PasswordResetToken, Zone, Notification, SupportMessage

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    ordering = ("email",)
    list_display = ("email", "is_active", "is_staff", "date_joined")
    fieldsets = ((None, {"fields": ("email", "password")}), ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}))
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("email", "password1", "password2")} ),)
    search_fields = ("email",)


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ("from_email", "subject", "forwarded", "received_at")
    list_filter = ("forwarded",)
    search_fields = ("from_email", "to_email", "subject", "text_body")
    readonly_fields = ("resend_email_id", "from_email", "to_email", "subject", "text_body", "html_body", "forwarded", "received_at")
    ordering = ("-received_at",)


for model in [Profile, UserRole, OTPCode, PasswordResetToken, Zone, Notification]:
    admin.site.register(model)
