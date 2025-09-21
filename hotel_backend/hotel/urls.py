from django.urls import path
from .views import dashboard_view, cleanStart, cleanEnd, login_view
from .views import signup_view, RoleLoginView, dashboard, delete_account, remove_account
from django.contrib.auth.views import LogoutView
from django.contrib.auth.decorators import login_required

urlpatterns = [
    path('getRoom/', dashboard_view),
    path('cleanStart/', cleanStart),
    path('endClean/', cleanEnd),
    path("signup/", signup_view, name="signup"),
    #path('login/', login_view),
    path("login/", RoleLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("dashboard/", dashboard, name="dashboard"),
    path("delete-account/", delete_account, name="delete_account"), #to deactivate account (keeps user data such as logs)
    path("remove-account/", remove_account, name="remove_account"), #to remove an account permanently (deletes all user data with the user)
]
