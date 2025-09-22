from rest_framework.permissions import BasePermission
from .models import Admin, Maid

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            Admin.objects.filter(user=request.user).exists()
        )

class IsMaid(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            Maid.objects.filter(user=request.user).exists()
        )
