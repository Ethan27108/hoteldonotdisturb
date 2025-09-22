from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import SignUpForm
from .models import Maid, Admin, Room, Task
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
from django.utils import timezone

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
            return JsonResponse({"token": token.key, "role": "admin", "success": True}, status=status.HTTP_200_OK)
        return JsonResponse({"error": "Invalid credentials or not an Admin", "success":False}, status=status.HTTP_401_UNAUTHORIZED)


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
        return JsonResponse({"error": "Invalid credentials or not a Maid", "success":False}, status=status.HTTP_401_UNAUTHORIZED)


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

        return JsonResponse(
            {
                "message": "Maid account created successfully",
                "role": "maid",
            },
            status=status.HTTP_201_CREATED,
        )

#Get Maid Id Function
class GetMaidIdView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            maid = Maid.objects.get(user=request.user)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "This user is not a Maid"}, status=status.HTTP_400_BAD_REQUEST)

        return JsonResponse(
            {"maid_id": maid.maid_id, "username": request.user.username},
            status=status.HTTP_200_OK
        )


#Get Rooms By Maid Id Function
class GetRoomsByMaidIdView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            maid = Maid.objects.get(user=request.user)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "This user is not a Maid"}, status=status.HTTP_400_BAD_REQUEST)

        rooms = Room.objects.all().values(
            "room_id", "room_number", "status", "battery_indicator", "battery_last_checked", "updated_at"
        )
        return JsonResponse(
            {"maid_id": maid.maid_id, "rooms": list(rooms)},
            status=status.HTTP_200_OK
        )
        
#Clean Start Function
class CleanStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        maid_id = request.data.get("maid_id")
        room_id = request.data.get("room_id")

        if not maid_id or not room_id:
            return JsonResponse({"error": "maid_id and room_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            maid = Maid.objects.get(maid_id=maid_id)
            room = Room.objects.get(room_id=room_id)
        except (Maid.DoesNotExist, Room.DoesNotExist):
            return JsonResponse({"error": "Invalid maid_id or room_id"}, status=status.HTTP_404_NOT_FOUND)

        try:
            task = Task.objects.get(maid=maid, room=room, status="pending")
        except Task.DoesNotExist:
            return JsonResponse({"error": "No pending task for this maid and room"}, status=status.HTTP_404_NOT_FOUND)

        task.status = "in_progress"
        task.start_time = timezone.now()
        task.save()

        return JsonResponse(
            {"message": "Cleaning started", "task_id": task.task_id, "status": task.status, "start_time": task.start_time},
            status=status.HTTP_200_OK,
        )
        
#Clean End Function
class CleanEndView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        maid_id = request.data.get("maid_id")
        room_id = request.data.get("room_id")

        if not maid_id or not room_id:
            return JsonResponse({"error": "maid_id and room_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            maid = Maid.objects.get(maid_id=maid_id)
            room = Room.objects.get(room_id=room_id)
        except (Maid.DoesNotExist, Room.DoesNotExist):
            return JsonResponse({"error": "Invalid maid_id or room_id"}, status=status.HTTP_404_NOT_FOUND)

        try:
            task = Task.objects.get(maid=maid, room=room, status="in_progress")
        except Task.DoesNotExist:
            return JsonResponse({"error": "No task in progress for this maid and room"}, status=status.HTTP_404_NOT_FOUND)


        task.status = "completed"
        task.finish_time = timezone.now()
        task.save()


        if task.start_time:
            duration = task.finish_time - task.start_time
            duration_minutes = round(duration.total_seconds() / 60, 2)
            time_message = f"It took {duration_minutes} minutes to clean the room."
        else:
            time_message = "Start time not recorded; unable to calculate duration."

        return JsonResponse(
            {
                "message": "Cleaning completed",
                "task_id": task.task_id,
                "status": task.status,
                "finish_time": task.finish_time,
                "duration": time_message,
            },
            status=status.HTTP_200_OK,
        )