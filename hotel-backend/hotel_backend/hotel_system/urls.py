from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views
from hotel.views import signup_view, RoleLoginView, dashboard
from django.contrib.auth.views import LogoutView
from hotel.views import delete_account
from hotel.views import remove_account


urlpatterns = [
    path("admin/", admin.site.urls),
    path("signup/", signup_view, name="signup"),
    path("login/", RoleLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("dashboard/", dashboard, name="dashboard"),
    path("delete-account/", delete_account, name="delete_account"), #to deactivate account (keeps user data such as logs)
    path("remove-account/", remove_account, name="remove_account"), #to remove an account permanently (deletes all user data with the user)
]
