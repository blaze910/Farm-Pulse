from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Profile, UserRole, OTPCode, PasswordResetToken, Zone, Notification

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    ordering = ("email",)
    list_display = ("email", "is_active", "is_staff", "date_joined")
    fieldsets = ((None, {"fields": ("email", "password")}), ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}))
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("email", "password1", "password2")} ),)
    search_fields = ("email",)

for model in [Profile, UserRole, OTPCode, PasswordResetToken, Zone, Notification]:
    admin.site.register(model)
