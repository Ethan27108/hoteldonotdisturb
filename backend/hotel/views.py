from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import SignUpForm
from .models import Maid, Admin
from django.contrib.auth.views import LoginView
from django.contrib import messages
from .forms import CustomLoginForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import logout as django_logout
from django.http import JsonResponse

#Login Functions
class AdminLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if user and Admin.objects.filter(user=user).exists():
            token, created = Token.objects.get_or_create(user=user)
            return JsonResponse({"token": token.key, "role": "admin"}, status=status.HTTP_200_OK)
        return JsonResponse({"error": "Invalid credentials or not an Admin"}, status=status.HTTP_401_UNAUTHORIZED)


class MaidLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if user and Maid.objects.filter(user=user).exists():
            token, created = Token.objects.get_or_create(user=user)
            return JsonResponse({"token": token.key, "role": "maid", "success": True}, status=status.HTTP_200_OK)
        return JsonResponse({"error": "Invalid credentials or not a Maid"}, status=status.HTTP_401_UNAUTHORIZED)


#Logout Function
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            
            request.user.auth_token.delete()
        except Token.DoesNotExist:
            return JsonResponse({"error": "No active session found"}, status=status.HTTP_400_BAD_REQUEST)

        return JsonResponse({"message": "Successfully logged out"}, status=status.HTTP_200_OK)


#Deactivate Accoun
class DeactivateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.is_active = False
        user.save()

        if hasattr(user, "auth_token"):
            user.auth_token.delete()

        django_logout(request)

        return JsonResponse(
            {"message": "Account deactivated successfully"},
            status=status.HTTP_200_OK
        )

#Delete Account
class RemoveAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        username = user.username


        if hasattr(user, "auth_token"):
            user.auth_token.delete()

        user.delete()

        return JsonResponse(
            {"message": f"Account '{username}' permanently deleted"},
            status=status.HTTP_200_OK
        )


# Signup Functions
class AdminSignupView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email")
        name = request.data.get("name")

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        admin = Admin.objects.create(user=user, name=name)

        token, created = Token.objects.get_or_create(user=user)
        return JsonResponse(
            {
                "message": "Admin account created successfully",

                "role": "admin",
            },
            status=status.HTTP_201_CREATED,
        )


class MaidSignupView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email")
        name = request.data.get("name")
        profile_info = request.data.get("profile_info", "")

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        maid = Maid.objects.create(user=user, name=name, profile_info=profile_info)

        token, created = Token.objects.get_or_create(user=user)
        return JsonResponse(
            {
                "message": "Maid account created successfully",

                "role": "maid",
            },
            status=status.HTTP_201_CREATED,

        )
