from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import SignUpForm
from .models import Maid, Admin, Room, Task, Floor
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
from .models import MaidStat


#Login Functions (Maid + Admin)
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


#Logout Function (Miad + Admin)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            
            request.user.auth_token.delete()
        except Token.DoesNotExist:
            return JsonResponse({"error": "No active session found"}, status=status.HTTP_400_BAD_REQUEST)

        return JsonResponse({"message": "Successfully logged out"}, status=status.HTTP_200_OK)


#Deactivate Maid's Own Account Function (Maid)
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

#Delete Admin's own Account Function (Admin)
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


# Signup Functions (Maid + Admin)
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

#Get Maid Id Function (Util)
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


#Get Rooms By Maid Id Function (Util)
class GetRoomsByMaidIdView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            maid = Maid.objects.get(user=request.user)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "This user is not a Maid"}, status=status.HTTP_400_BAD_REQUEST)

        rooms = Room.objects.filter(task__maid=maid).distinct().values(
            "room_id",
            "room_number",
            "status",
            "battery_indicator",
            "battery_last_checked",
            "updated_at"
        )

        return JsonResponse(
            {"maid_id": maid.maid_id, "rooms": list(rooms)},
            status=status.HTTP_200_OK
        )
        
#Clean Start Function (Maid)
class CleanStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        maid_id = request.data.get("maid_id")
        room_number = request.data.get("room_number")

        if not maid_id or not room_number:
            return JsonResponse({"error": "maid_id and room_number are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            maid = Maid.objects.get(maid_id=maid_id)
            room = Room.objects.get(room_number=room_number)
        except (Maid.DoesNotExist, Room.DoesNotExist):
            return JsonResponse({"error": "Invalid maid_id or room_number"}, status=status.HTTP_404_NOT_FOUND)

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
        
#Clean End Function (Maid)
class CleanEndView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        maid_id = request.data.get("maid_id")
        room_number = request.data.get("room_number")
        comment = request.data.get("comment")

        if not maid_id or not room_number:
            return JsonResponse({"error": "maid_id and room_number are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            maid = Maid.objects.get(maid_id=maid_id)
            room = Room.objects.get(room_number=room_number)
        except (Maid.DoesNotExist, Room.DoesNotExist):
            return JsonResponse({"error": "Invalid maid_id or room_number"}, status=status.HTTP_404_NOT_FOUND)

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
        

#View Maid Stats Function (Maid)
class GetMaidStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            maid = Maid.objects.get(user=request.user)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "This user is not a Maid"}, status=status.HTTP_400_BAD_REQUEST)

        stats_qs = (
            MaidStat.objects
            .filter(maid=maid)
            .order_by("-date")
            .values(
                "stat_id",
                "date",
                "total_rooms_cleaned",
                "avg_rooms_per_shift",
                "avg_time_per_room",
                "working_hours",
                "active_cleaning_hours",
                "completion_rate",
                "tasks_incomplete",
                "emergency_tasks_handled",
                "battery_changes_performed",
                "on_time_shift_attendance",
                "break_usage",
            )
        )

        return JsonResponse(
            {
                "maid_id": maid.maid_id,
                "stats": list(stats_qs),
            },
            status=status.HTTP_200_OK
        )
       
# Deactivate Maid's Account By Admin Function (Admin)
class AdminDeactivateMaidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
       
        if not Admin.objects.filter(user=request.user).exists():
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        maid_id = request.data.get("maid_id")

        if not maid_id:
            return JsonResponse({"error": "maid_id is required."}, status=400)

        try:
            maid = Maid.objects.get(maid_id=maid_id)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "Maid not found."}, status=404)

        user = maid.user
        user.is_active = False
        user.save()

        return JsonResponse(
            {"message": f"Maid account (ID: {maid_id}) deactivated successfully."},
            status=status.HTTP_200_OK
        )
        
# Permanently Delete Maid's Account By Admin Function (Admin)
class AdminDeleteMaidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
      
        if not Admin.objects.filter(user=request.user).exists():
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        maid_id = request.data.get("maid_id")
        if not maid_id:
            return JsonResponse({"error": "maid_id is required."}, status=400)

        try:
            maid = Maid.objects.select_related("user").get(maid_id=maid_id)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "Maid not found."}, status=404)

        target_user = maid.user
    
        if hasattr(target_user, "auth_token"):
            target_user.auth_token.delete()

        target_user.delete()

        return JsonResponse(
            {"message": f"Maid account (ID: {maid_id}) permanently deleted."},
            status=status.HTTP_200_OK
        )
        
        
#Create Floor Function (Admin)
class AdminAddFloorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            admin = Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        floor_number = request.data.get("floor_number")
        if floor_number is None:
            return JsonResponse({"error": "floor_number is required."}, status=400)

        try:
            floor_number = int(floor_number)
        except (TypeError, ValueError):
            return JsonResponse({"error": "floor_number must be an integer."}, status=400)

        if floor_number <= 0:
            return JsonResponse({"error": "floor_number must be greater than 0."}, status=400)

        if Floor.objects.filter(floor_number=floor_number).exists():
            return JsonResponse(
                {"error": f"Floor {floor_number} already exists."},
                status=409
            )

        floor = Floor.objects.create(
            floor_number=floor_number,
            created_by=admin,
        )

        return JsonResponse(
            {
                "message": "Floor created successfully.",
                "floor": {
                    "floor_id": floor.floor_id,
                    "floor_number": floor.floor_number,
                    "created_by_admin_id": admin.admin_id,
                    "created_at": floor.created_at,
                    "updated_at": floor.updated_at,
                },
            },
            status=status.HTTP_201_CREATED,
            safe=False
        )
        
#Delete Floor Function (Admin)
class AdminDeleteFloorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Ensure the logged-in user is an Admin
        try:
            admin = Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        floor_id = request.data.get("floor_id")

        if not floor_id:
            return JsonResponse({"error": "floor_id is required."}, status=400)

        try:
            floor = Floor.objects.get(floor_id=floor_id)
        except Floor.DoesNotExist:
            return JsonResponse({"error": "Floor not found."}, status=404)

        # Delete the floor (this will also delete its rooms because of on_delete=models.CASCADE)
        floor.delete()

        return JsonResponse(
            {"message": f"Floor with ID {floor_id} deleted successfully."},
            status=status.HTTP_200_OK
        )

#Edit Floor Function (Admin)

class AdminEditFloorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Ensure caller is an admin
        try:
            admin = Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        floor_id = request.data.get("floor_id")
        new_floor_number = request.data.get("floor_number")

        if not floor_id:
            return JsonResponse({"error": "floor_id is required."}, status=400)
        if new_floor_number is None:
            return JsonResponse({"error": "floor_number is required."}, status=400)

        try:
            new_floor_number = int(new_floor_number)
        except (TypeError, ValueError):
            return JsonResponse({"error": "floor_number must be an integer."}, status=400)

        if new_floor_number <= 0:
            return JsonResponse({"error": "floor_number must be greater than 0."}, status=400)

        try:
            floor = Floor.objects.get(floor_id=floor_id)
        except Floor.DoesNotExist:
            return JsonResponse({"error": "Floor not found."}, status=404)

        if Floor.objects.filter(floor_number=new_floor_number).exclude(floor_id=floor_id).exists():
            return JsonResponse({"error": f"Floor number {new_floor_number} already exists."}, status=409)

        floor.floor_number = new_floor_number
        floor.save()

        return JsonResponse(
            {
                "message": f"Floor {floor_id} updated successfully.",
                "floor": {
                    "floor_id": floor.floor_id,
                    "new_floor_number": floor.floor_number,
                    "updated_at": floor.updated_at,
                },
            },
            status=status.HTTP_200_OK
        )

#View Floor Function - View Rooms in a Floor (Admin)

class AdminViewFloorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            admin = Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        floor_id = request.data.get("floor_id")
        floor_number = request.data.get("floor_number")
        
        #it accepts either floor_id or floor_number
        if not floor_id and floor_number is None:
            return JsonResponse({"error": "Provide either floor_id or floor_number."}, status=400)

        floor = None
        if floor_id:
            try:
                floor = Floor.objects.get(floor_id=floor_id)
            except Floor.DoesNotExist:
                return JsonResponse({"error": "Floor not found."}, status=404)
        else:
            try:
                floor_number = int(floor_number)
            except (TypeError, ValueError):
                return JsonResponse({"error": "floor_number must be an integer."}, status=400)

            if floor_number <= 0:
                return JsonResponse({"error": "floor_number must be greater than 0."}, status=400)

            try:
                floor = Floor.objects.get(floor_number=floor_number)
            except Floor.DoesNotExist:
                return JsonResponse({"error": "Floor not found."}, status=404)

        room_numbers = list(
            Room.objects.filter(floor=floor).order_by("room_number").values_list("room_number", flat=True)
        )

        return JsonResponse(
            {
                "floor": {
                    "floor_number": floor.floor_number,
                },
                "rooms": room_numbers
            },
            status=status.HTTP_200_OK
        )