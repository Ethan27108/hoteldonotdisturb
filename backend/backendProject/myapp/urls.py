from django.urls import path
from .views import login_view, dashboard_view

urlpatterns = [
    path('login/', login_view),
    path('getRoom/', dashboard_view),
]
