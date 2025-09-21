from django.urls import path
from .views import login_view, dashboard_view, cleanStart, cleanEnd

urlpatterns = [
    path('login/', login_view),
    path('getRoom/', dashboard_view),
    path('cleanStart/', cleanStart),
    path('endClean/', cleanEnd),
]
