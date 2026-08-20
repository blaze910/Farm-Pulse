from django.urls import path
from . import views

urlpatterns = [
    path("csrf/", views.csrf),
    path("signup/", views.signup),
    path("login/", views.login),
    path("logout/", views.logout),
    path("refresh/", views.refresh),
    path("profile/", views.me),
    path("profile/update/", views.update_profile),
    path("profile/password/", views.change_password),
    path("profile/email/", views.change_email),
    path("profile/avatar/", views.upload_avatar),
    path("zones/", views.zones),
    path("zones/create/", views.create_zone),
    path("zones/<uuid:zone_id>/", views.delete_zone),
    path("notifications/", views.notifications),
    path("notifications/read/", views.mark_notifications_read),
    path("delete/", views.delete_account),
    path("otp/request/", views.request_otp),
    path("otp/verify/", views.verify_otp),
    path("password-reset/confirm/", views.confirm_password_reset),
    path("oauth/google/start/", views.google_start),
    path("oauth/google/callback/", views.google_callback),
]
