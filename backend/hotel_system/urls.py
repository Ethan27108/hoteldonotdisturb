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
from hotel.views import AdminAddRoomView
from hotel.views import AdminEditRoomView
from hotel.views import AdminDeleteRoomView
from hotel.views import AdminViewRoomView
from hotel.views import AdminEditProfileView
from hotel.views import AdminViewProfileView
from hotel.views import MaidEditProfileView
from hotel.views import MaidViewProfileView
from hotel.views import AdminSetupMaidProfileView
from hotel.views import AdminViewMaidProfileView
from hotel.views import AdminGetMaidStatsView

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
    path("api/admin/addRoom/", AdminAddRoomView.as_view(), name="admin-add-room"),
    path("api/admin/editRoom/", AdminEditRoomView.as_view(), name="admin-edit-room"),
    path("api/admin/deleteRoom/", AdminDeleteRoomView.as_view(), name="admin-delete-room"),
    path("api/admin/viewRoom/", AdminViewRoomView.as_view(), name="admin-view-room"),
    path("api/admin/editProfile/", AdminEditProfileView.as_view(), name="admin-edit-profile"),
    path("api/admin/viewProfile/", AdminViewProfileView.as_view(), name="admin-view-profile"),
    path("api/maid/editProfile/", MaidEditProfileView.as_view(), name="maid-edit-account"),
    path("api/maid/viewProfile/", MaidViewProfileView.as_view(), name="maid-view-profile"),
    path("api/admin/setupMaidProfile/", AdminSetupMaidProfileView.as_view(), name="admin-setup-maid-profile"),
    path("api/admin/viewMaidProfile/", AdminViewMaidProfileView.as_view(), name="admin-view-maid-profile"),
    path("api/admin/maidStats/", AdminGetMaidStatsView.as_view(), name="admin-maid-stats"),

    
    
    
]
