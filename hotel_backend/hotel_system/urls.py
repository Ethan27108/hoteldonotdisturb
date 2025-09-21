from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from hotel.views import signup_view, RoleLoginView, dashboard
from django.contrib.auth.views import LogoutView
from hotel.views import delete_account
from hotel.views import remove_account
from django.http import HttpResponse

urlpatterns = [
    path('', lambda request: HttpResponse("Backend up")),
    path("admin/", admin.site.urls),
    path('api/', include('hotel.urls')),  # <== clean API route
    
]
