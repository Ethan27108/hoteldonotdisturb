from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views
from hotel.views import AdminLoginView, MaidLoginView
from hotel.views import AdminSignupView, MaidSignupView
from hotel.views import LogoutView
from hotel.views import DeactivateAccountView, RemoveAccountView
from django.http import HttpResponse
from hotel.views import GetMaidIdView
from hotel.views import GetRoomsByMaidIdView
from hotel.views import CleanStartView
from hotel.views import CleanEndView
from hotel.views import GetMaidStatsView
from hotel.views import AdminDeactivateMaidView
from hotel.views import AdminDeleteMaidView
from hotel.views import AdminAddFloorView
from hotel.views import AdminDeleteFloorView
from hotel.views import AdminEditFloorView
from hotel.views import AdminViewFloorView

urlpatterns = [
    path('', lambda request: HttpResponse("Backend up")),
    path("admin/", admin.site.urls),
    path("api/signup/admin/", AdminSignupView.as_view(), name="admin-signup"),
    path("api/signup/maid/", MaidSignupView.as_view(), name="maid-signup"),
    path("api/login/admin/", AdminLoginView.as_view(), name="admin-login"),
    path("api/login/maid/", MaidLoginView.as_view(), name="maid-login"),
    path("api/logout/", LogoutView.as_view(), name="logout"),
    path("api/account/deactivate/", DeactivateAccountView.as_view(), name="deactivate-account"), #to deactivate maid's own account (keeps user data such as logs)
    path("api/account/remove/", RemoveAccountView.as_view(), name="remove-account"), #to remove an account permanently (deletes all user data with the user)
    path("api/getMaidId/", GetMaidIdView.as_view(), name="maid-me"),
    path("api/getRoom/", GetRoomsByMaidIdView.as_view(), name="maid-rooms-by-id"),
    path("api/cleanStart/", CleanStartView.as_view(), name="clean-start"),
    path("api/cleanEnd/", CleanEndView.as_view(), name="clean-end"),
    path("api/viewStats/", GetMaidStatsView.as_view(), name="get-maid-stats"),
    path("api/admin/deactivateMaid/", AdminDeactivateMaidView.as_view(), name="admin-deactivate-maid"), #to deactivate maid's account by admin
    path("api/admin/deleteMaid/", AdminDeleteMaidView.as_view(), name="admin-delete-maid"), #to delete maid's account by admin
    path("api/admin/addFloor/", AdminAddFloorView.as_view(), name="admin-add-floor"),
    path("api/admin/deleteFloor/", AdminDeleteFloorView.as_view(), name="admin-delete-floor"),
    path("api/admin/editFloor/", AdminEditFloorView.as_view(), name="admin-edit-floor"),
    path("api/admin/viewFloor/", AdminViewFloorView.as_view(), name="admin-view-floor"),

]
