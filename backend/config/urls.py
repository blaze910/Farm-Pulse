from django.contrib import admin
from django.urls import include, path
from agro import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", views.health),
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/", include("agro.urls")),
]
