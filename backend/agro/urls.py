from django.urls import path
from agro import views
urlpatterns = [
    path("places/", views.places),
    path("places/reverse/", views.places_reverse),
    path("snapshot/", views.snapshot),
    path("market/", views.market),
    path("fx/", views.fx),
]
