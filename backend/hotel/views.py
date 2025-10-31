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
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from datetime import datetime
from django.utils.dateparse import parse_date



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
        

#Add Room Function (Admin) - accepts either floor_number or floor_id - initial room status is "clean" - initial battery is "100" - initial battery last checked is "null"
class AdminAddRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
    
        try:
            Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        room_number = request.data.get("room_number")
        floor_id = request.data.get("floor_id")
        floor_number = request.data.get("floor_number")

    
        if room_number is None:
            return JsonResponse({"error": "room_number is required."}, status=400)
        try:
            room_number = int(room_number)
            if room_number <= 0:
                return JsonResponse({"error": "room_number must be greater than 0."}, status=400)
        except (TypeError, ValueError):
            return JsonResponse({"error": "room_number must be an integer."}, status=400)

    
        if floor_id is None and floor_number is None:
            return JsonResponse({"error": "Provide floor_id or floor_number."}, status=400)


        floor_by_id = None
        floor_by_number = None

        if floor_id is not None:
            try:
                floor_id_int = int(floor_id)
                if floor_id_int <= 0:
                    return JsonResponse({"error": "floor_id must be greater than 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "floor_id must be an integer."}, status=400)
            try:
                floor_by_id = Floor.objects.get(floor_id=floor_id_int)
            except Floor.DoesNotExist:
                return JsonResponse({"error": f"Floor with id {floor_id_int} not found."}, status=404)

        if floor_number is not None:
            try:
                floor_number_int = int(floor_number)
                if floor_number_int <= 0:
                    return JsonResponse({"error": "floor_number must be greater than 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "floor_number must be an integer."}, status=400)
            try:
                floor_by_number = Floor.objects.get(floor_number=floor_number_int)
            except Floor.DoesNotExist:
                return JsonResponse({"error": f"Floor {floor_number_int} not found."}, status=404)


        if floor_by_id and floor_by_number and floor_by_id.floor_id != floor_by_number.floor_id:
            return JsonResponse(
                {"error": "floor_id and floor_number refer to different floors."},
                status=400
            )

        floor = floor_by_id or floor_by_number

        if Room.objects.filter(floor=floor, room_number=room_number).exists():
            return JsonResponse(
                {"error": f"Room {room_number} already exists on floor {floor.floor_number}."},
                status=409
            )

        room = Room.objects.create(
            room_number=room_number,
            floor=floor,
            status="clean",
        )

        return JsonResponse(
            {
                "message": "Room created successfully.",
                "room": {
                    "room_id": room.room_id,
                    "room_number": room.room_number,
                    "floor_id": floor.floor_id,
                    "floor_number": floor.floor_number,
                    "status": room.status,
                    "battery_indicator": room.battery_indicator,
                    "battery_last_checked": room.battery_last_checked,
                    "updated_at": room.updated_at,
                },
            },
            status=status.HTTP_201_CREATED
        )




#Edit Room Function (Admin) - only accepts room_id (because we are using room_number for the edit) - can edit the following fields: room_number, status, (floor_id or floor_number)

VALID_ROOM_STATUSES = {"clean", "do_not_disturb", "cleaning_in_progress", "emergency_clean", "dirty"}
class AdminEditRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
    
        try:
            Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        room_id = request.data.get("room_id")
        if not room_id:
            return JsonResponse({"error": "room_id is required."}, status=400)

        try:
            room = Room.objects.select_related("floor").get(room_id=room_id)
        except Room.DoesNotExist:
            return JsonResponse({"error": "Room not found."}, status=404)


        new_room_number = request.data.get("room_number")
        new_floor_id = request.data.get("floor_id")
        new_floor_number = request.data.get("floor_number")
        new_status = request.data.get("status")


        target_floor = room.floor 

        if new_floor_id is not None:
            try:
                fid = int(new_floor_id)
                if fid <= 0:
                    return JsonResponse({"error": "floor_id must be greater than 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "floor_id must be an integer."}, status=400)
            try:
                target_floor = Floor.objects.get(floor_id=fid)
            except Floor.DoesNotExist:
                return JsonResponse({"error": f"Floor with id {fid} not found."}, status=404)

        if new_floor_number is not None:
            try:
                fnum = int(new_floor_number)
                if fnum <= 0:
                    return JsonResponse({"error": "floor_number must be greater than 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "floor_number must be an integer."}, status=400)
            try:
                floor_by_number = Floor.objects.get(floor_number=fnum)
            except Floor.DoesNotExist:
                return JsonResponse({"error": f"Floor {fnum} not found."}, status=404)

            if new_floor_id is not None and floor_by_number.floor_id != target_floor.floor_id:
                return JsonResponse({"error": "floor_id and floor_number refer to different floors."}, status=400)

            target_floor = floor_by_number

        if new_room_number is not None:
            try:
                new_room_number = int(new_room_number)
                if new_room_number <= 0:
                    return JsonResponse({"error": "room_number must be greater than 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "room_number must be an integer."}, status=400)

        if new_status is not None:
            if new_status not in VALID_ROOM_STATUSES:
                return JsonResponse(
                    {"error": f"status must be one of {sorted(list(VALID_ROOM_STATUSES))}."},
                    status=400
                )

        final_room_number = new_room_number if new_room_number is not None else room.room_number
        final_floor = target_floor

        if Room.objects.filter(floor=final_floor, room_number=final_room_number).exclude(room_id=room.room_id).exists():
            return JsonResponse(
                {"error": f"Room {final_room_number} already exists on floor {final_floor.floor_number}."},
                status=409
            )

        room.floor = final_floor
        room.room_number = final_room_number
        if new_status is not None:
            room.status = new_status
        room.save()

        return JsonResponse(
            {
                "message": "Room updated successfully.",
                "room": {
                    "room_id": room.room_id,
                    "room_number": room.room_number,
                    "floor_id": room.floor.floor_id,
                    "floor_number": room.floor.floor_number,
                    "status": room.status,
                    "battery_indicator": room.battery_indicator,        # unchanged
                    "battery_last_checked": room.battery_last_checked,  # unchanged
                    "updated_at": room.updated_at,
                },
            },
            status=status.HTTP_200_OK
        )


#Delete Room Function (Admin) - accepts either room_id or room_number, and either floor_id or floor_number
class AdminDeleteRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        room_id = request.data.get("room_id")
        room_number = request.data.get("room_number")
        floor_id = request.data.get("floor_id")
        floor_number = request.data.get("floor_number")

        room = None

        if room_id is not None:
            try:
                rid = int(room_id)
                if rid <= 0:
                    return JsonResponse({"error": "room_id must be greater than 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "room_id must be an integer."}, status=400)

            try:
                room = Room.objects.get(room_id=rid)
            except Room.DoesNotExist:
                return JsonResponse({"error": "Room not found."}, status=404)

        else:
            if room_number is None:
                return JsonResponse(
                    {"error": "Provide room_id OR (room_number with floor_id or floor_number)."},
                    status=400
                )

            try:
                rnum = int(room_number)
                if rnum <= 0:
                    return JsonResponse({"error": "room_number must be greater than 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "room_number must be an integer."}, status=400)

            floor = None
            floor_by_id = None
            floor_by_num = None

            if floor_id is not None:
                try:
                    fid = int(floor_id)
                    if fid <= 0:
                        return JsonResponse({"error": "floor_id must be greater than 0."}, status=400)
                except (TypeError, ValueError):
                    return JsonResponse({"error": "floor_id must be an integer."}, status=400)
                try:
                    floor_by_id = Floor.objects.get(floor_id=fid)
                except Floor.DoesNotExist:
                    return JsonResponse({"error": f"Floor with id {fid} not found."}, status=404)

            if floor_number is not None:
                try:
                    fnum = int(floor_number)
                    if fnum <= 0:
                        return JsonResponse({"error": "floor_number must be greater than 0."}, status=400)
                except (TypeError, ValueError):
                    return JsonResponse({"error": "floor_number must be an integer."}, status=400)
                try:
                    floor_by_num = Floor.objects.get(floor_number=fnum)
                except Floor.DoesNotExist:
                    return JsonResponse({"error": f"Floor {fnum} not found."}, status=404)

            if not floor_by_id and not floor_by_num:
                return JsonResponse(
                    {"error": "When using room_number, provide floor_id or floor_number."},
                    status=400
                )

            if floor_by_id and floor_by_num and floor_by_id.floor_id != floor_by_num.floor_id:
                return JsonResponse({"error": "floor_id and floor_number refer to different floors."}, status=400)

            floor = floor_by_id or floor_by_num

            try:
                room = Room.objects.get(floor=floor, room_number=rnum)
            except Room.DoesNotExist:
                return JsonResponse({"error": "Room not found on the specified floor."}, status=404)

        deleted_room_id = room.room_id
        deleted_room_number = room.room_number
        deleted_floor_number = room.floor.floor_number
        room.delete()

        return JsonResponse(
            {
                "message": "Room deleted successfully.",
                "deleted": {
                    "room_id": deleted_room_id,
                    "room_number": deleted_room_number,
                    "floor_number": deleted_floor_number
                }
            },
            status=status.HTTP_200_OK
        )



#View Room Function (Admin) - accepts either room_id or room_number, and either floor_id or floor_number

class AdminViewRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        room_id = request.data.get("room_id")
        room_number = request.data.get("room_number")
        floor_id = request.data.get("floor_id")
        floor_number = request.data.get("floor_number")

        room = None

        if room_id is not None:
            try:
                rid = int(room_id)
                if rid <= 0:
                    return JsonResponse({"error": "room_id must be greater than 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "room_id must be an integer."}, status=400)

            try:
                room = Room.objects.select_related("floor").get(room_id=rid)
            except Room.DoesNotExist:
                return JsonResponse({"error": "Room not found."}, status=404)

        else:
            if room_number is None:
                return JsonResponse(
                    {"error": "Provide room_id OR (room_number with floor_id or floor_number)."},
                    status=400
                )

            try:
                rnum = int(room_number)
                if rnum <= 0:
                    return JsonResponse({"error": "room_number must be greater than 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "room_number must be an integer."}, status=400)

            floor_by_id = None
            floor_by_num = None

            if floor_id is not None:
                try:
                    fid = int(floor_id)
                    if fid <= 0:
                        return JsonResponse({"error": "floor_id must be greater than 0."}, status=400)
                except (TypeError, ValueError):
                    return JsonResponse({"error": "floor_id must be an integer."}, status=400)
                try:
                    floor_by_id = Floor.objects.get(floor_id=fid)
                except Floor.DoesNotExist:
                    return JsonResponse({"error": f"Floor with id {fid} not found."}, status=404)

            if floor_number is not None:
                try:
                    fnum = int(floor_number)
                    if fnum <= 0:
                        return JsonResponse({"error": "floor_number must be greater than 0."}, status=400)
                except (TypeError, ValueError):
                    return JsonResponse({"error": "floor_number must be an integer."}, status=400)
                try:
                    floor_by_num = Floor.objects.get(floor_number=fnum)
                except Floor.DoesNotExist:
                    return JsonResponse({"error": f"Floor {fnum} not found."}, status=404)

            if not floor_by_id and not floor_by_num:
                return JsonResponse(
                    {"error": "When using room_number, provide floor_id or floor_number."},
                    status=400
                )

            if floor_by_id and floor_by_num and floor_by_id.floor_id != floor_by_num.floor_id:
                return JsonResponse({"error": "floor_id and floor_number refer to different floors."}, status=400)

            floor = floor_by_id or floor_by_num

            try:
                room = Room.objects.select_related("floor").get(floor=floor, room_number=rnum)
            except Room.DoesNotExist:
                return JsonResponse({"error": "Room not found on the specified floor."}, status=404)

        return JsonResponse(
            {
                "room": {
                    "room_number": room.room_number,
                    "floor_number": room.floor.floor_number,
                    "status": room.status,
                    "battery_indicator": room.battery_indicator,
                    "battery_last_checked": room.battery_last_checked,
                }
            },
            status=status.HTTP_200_OK
        )


#Admin Edit Profile Function (Admin) - the admin can edit his own profile info
class AdminEditProfileView(APIView):
    """
    all fields are optional - the function only updates provided fields - fields can be:
      "name"
      "username"
      "email"
      "current_password" - required only if changing password
      "new_password" -  requires current_password
      
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            admin = Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        user = request.user

        name = request.data.get("name")
        username = request.data.get("username")
        email = request.data.get("email")
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if name is not None:
            name = str(name).strip()
            if not name:
                return JsonResponse({"error": "name cannot be empty."}, status=400)
            if len(name) > 255:
                return JsonResponse({"error": "name must be at most 255 characters."}, status=400)
            admin.name = name

        if username is not None:
            username = str(username).strip()
            if not username:
                return JsonResponse({"error": "username cannot be empty."}, status=400)
            if len(username) > 150:
                return JsonResponse({"error": "username must be at most 150 characters."}, status=400)
            if User.objects.filter(username=username).exclude(id=user.id).exists():
                return JsonResponse({"error": "username is already taken."}, status=409)
            user.username = username

        if email is not None:
            email = str(email).strip()
            if not email:
                return JsonResponse({"error": "email cannot be empty."}, status=400)
            try:
                validate_email(email)
            except ValidationError:
                return JsonResponse({"error": "email is not valid."}, status=400)

            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return JsonResponse({"error": "email is already in use."}, status=409)
            user.email = email

        if new_password is not None:
            if not current_password:
                return JsonResponse({"error": "current_password is required to change password."}, status=400)
            if not user.check_password(current_password):
                return JsonResponse({"error": "current_password is incorrect."}, status=403)
            if len(new_password) < 8:
                return JsonResponse({"error": "new_password must be at least 8 characters."}, status=400)
            user.set_password(new_password)

        user.save()
        if name is not None:
            admin.save(update_fields=["name", "updated_at"])

        return JsonResponse(
            {
                "message": "Account updated successfully.",
                "admin": {
                    "admin_id": admin.admin_id,
                    "name": admin.name,
                },
                "user": {
                    "username": user.username,
                    "email": user.email,
                }
            },
            status=status.HTTP_200_OK
        )

#Admin View Profile Function (Admin) - allows admin to view his own profile info
class AdminViewProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            admin = Admin.objects.select_related("user").get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        user = admin.user

        return JsonResponse(
            {
                "admin_profile": {
                    "name": admin.name,
                    "username": user.username,
                    "email": user.email,
                    "admin_created_at": admin.created_at,
                }
            },
            status=status.HTTP_200_OK
        )
        
# Edit Maid Profile Function (Maid) - allows maid to edit his/her own profile

class MaidEditProfileView(APIView):
    """
    all fields are optional - only provided fields are updated - fields can be:

      "name"
      "profile_info"
      "username"
      "email"
      "current_password"  # required only if changing password
      "new_password"     # requires current_password

    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            maid = Maid.objects.select_related("user").get(user=request.user)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "Only maids can perform this action."}, status=403)

        user: User = maid.user

        name = request.data.get("name")
        profile_info = request.data.get("profile_info")
        username = request.data.get("username")
        email = request.data.get("email")
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if name is not None:
            name = str(name).strip()
            if not name:
                return JsonResponse({"error": "name cannot be empty."}, status=400)
            if len(name) > 255:
                return JsonResponse({"error": "name must be at most 255 characters."}, status=400)
            maid.name = name

        if profile_info is not None:
            profile_info = str(profile_info).strip()
            
            if len(profile_info) > 5000:
                return JsonResponse({"error": "profile_info is too long."}, status=400)
            maid.profile_info = profile_info

        if username is not None:
            username = str(username).strip()
            if not username:
                return JsonResponse({"error": "username cannot be empty."}, status=400)
            if len(username) > 150:
                return JsonResponse({"error": "username must be at most 150 characters."}, status=400)
            if User.objects.filter(username=username).exclude(id=user.id).exists():
                return JsonResponse({"error": "username is already taken."}, status=409)
            user.username = username

        if email is not None:
            email = str(email).strip()
            if not email:
                return JsonResponse({"error": "email cannot be empty."}, status=400)
            try:
                validate_email(email)
            except ValidationError:
                return JsonResponse({"error": "email is not valid."}, status=400)
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return JsonResponse({"error": "email is already in use."}, status=409)
            user.email = email

        if new_password is not None:
            if not current_password:
                return JsonResponse({"error": "current_password is required to change password."}, status=400)
            if not user.check_password(current_password):
                return JsonResponse({"error": "current_password is incorrect."}, status=403)
            if len(new_password) < 8:
                return JsonResponse({"error": "new_password must be at least 8 characters."}, status=400)
            user.set_password(new_password)

        user.save()
        if name is not None or profile_info is not None:
            maid.save(update_fields=["name", "profile_info", "updated_at"])

        return JsonResponse(
            {
                "message": "Account updated successfully.",
                "maid": {
                    "maid_id": maid.maid_id,
                    "name": maid.name,
                    "profile_info": maid.profile_info,
                },
                "user": {
                    "username": user.username,
                    "email": user.email,
                }
            },
            status=status.HTTP_200_OK
        )
        

#View Maid Profile Function - allows maid to view his/her own profile info
class MaidViewProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            maid = Maid.objects.select_related("user").get(user=request.user)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "Only maids can perform this action."}, status=403)

        user = maid.user

        return JsonResponse(
            {
                "maid_profile": {
                    "name": maid.name,
                    "profile_info": maid.profile_info,
                    "shift_day": maid.shift_day,
                    "shift_start_time": maid.shift_start_time,
                    "shift_end_time": maid.shift_end_time,
                    "break_minutes": maid.break_minutes,
                    "created_at": maid.created_at,
                    "username": user.username,
                    "email": user.email,
                }
            },
            status=status.HTTP_200_OK
        )



#-----------------------------------------------------------------------------------------------------------------
# validation code for shift days
ALLOWED_DAY_CODES = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}
FULL_TO_CODE = {
    "monday": "Mon", "tuesday": "Tue", "wednesday": "Wed",
    "thursday": "Thu", "friday": "Fri", "saturday": "Sat", "sunday": "Sun"
}

def _normalize_shift_days(raw):
    """
    accepts a list like ["Mon","Wed"] or ["Monday","Wednesday"]
              OR comma string "Mon, Wed" / "Monday, Wednesday".
    returns a list of unique 3-letter codes ["Mon","Wed"]
    """
    if raw is None:
        return None
    if isinstance(raw, str):
        raw = [x.strip() for x in raw.split(",") if x.strip()]
    if not isinstance(raw, list):
        raise ValueError("shift_days must be a list of strings or a comma-separated string.")

    out = []
    for v in raw:
        vlow = str(v).strip().lower()
        code = FULL_TO_CODE.get(vlow, str(v).strip()[:3].title())
        if code not in ALLOWED_DAY_CODES:
            raise ValueError(f"Invalid day '{v}'. Allowed: {sorted(ALLOWED_DAY_CODES)}")
        if code not in out:
            out.append(code)
    return out

def _parse_time(field_name, value):
    if value is None:
        return None
    if isinstance(value, str):
        val = value.strip()
        try:
            fmt = "%H:%M:%S" if len(val) == 8 else "%H:%M"
            return datetime.strptime(val, fmt).time()
        except ValueError:
            raise ValueError(f"{field_name} must be 'HH:MM' or 'HH:MM:SS' (24h).")
    raise ValueError(f"{field_name} must be a string.")
#------------------------------------------------------------------------------------------------------------------
#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^


# Setup Maid's Profile Function (Admin) - allows admin to setup info on maid's profile like shifts and break times
class AdminSetupMaidProfileView(APIView):
    """
    it accepts the these fields:
      "maid_id"                           # required
      "shift_days": Mon, Wed, Fri  # or Monday, Wednesday, Friday
      "shift_start_time": 09:00
      "shift_end_time": 17:00
      "break_minutes": 30

    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        maid_id = request.data.get("maid_id")
        if not maid_id:
            return JsonResponse({"error": "maid_id is required."}, status=400)

        try:
            maid = Maid.objects.select_related("user").get(maid_id=maid_id)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "Maid not found."}, status=404)

        raw_days = request.data.get("shift_days")
        raw_start = request.data.get("shift_start_time")
        raw_end   = request.data.get("shift_end_time")
        raw_break = request.data.get("break_minutes")

        if raw_days is None and raw_start is None and raw_end is None and raw_break is None:
            return JsonResponse({"error": "Provide at least one field to update."}, status=400)

        try:
            days = _normalize_shift_days(raw_days) if raw_days is not None else None
            start_time = _parse_time("shift_start_time", raw_start) if raw_start is not None else None
            end_time   = _parse_time("shift_end_time", raw_end) if raw_end is not None else None
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        if raw_break is not None:
            try:
                break_minutes = int(raw_break)
                if break_minutes < 0:
                    return JsonResponse({"error": "break_minutes must be >= 0."}, status=400)
            except (TypeError, ValueError):
                return JsonResponse({"error": "break_minutes must be an integer."}, status=400)
        else:
            break_minutes = None

        if start_time and end_time and end_time <= start_time:
            return JsonResponse({"error": "shift_end_time must be after shift_start_time."}, status=400)

        if days is not None:
            maid.shift_days = days
        if start_time is not None:
            maid.shift_start_time = start_time
        if end_time is not None:
            maid.shift_end_time = end_time
        if break_minutes is not None:
            maid.break_minutes = break_minutes

        maid.save()

        return JsonResponse(
            {
                "message": "Maid schedule updated successfully.",
                "maid": {
                    "maid_id": maid.maid_id,
                    "name": maid.name,
                    "shift_days": maid.shift_days,  # e.g., ["Mon","Wed","Fri"]
                    "shift_start_time": maid.shift_start_time,
                    "shift_end_time": maid.shift_end_time,
                    "break_minutes": maid.break_minutes,
                    "updated_at": maid.updated_at,
                }
            },
            status=status.HTTP_200_OK
        )
        
#View Maid Profile Function (Admin) - allows admin to view a maid's profile

class AdminViewMaidProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        maid_id = request.data.get("maid_id")
        if not maid_id:
            return JsonResponse({"error": "maid_id is required."}, status=400)

        try:
            maid = Maid.objects.select_related("user").get(maid_id=maid_id)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "Maid not found."}, status=404)
        
        if hasattr(maid, "shift_days"):
            shift_days = maid.shift_days
        else:
            shift_days = [x.strip() for x in (maid.shift_day or "").split(",") if x.strip()]

        user = maid.user
        return JsonResponse(
            {
                "maid_profile": {
                    "name": maid.name,
                    "profile_info": maid.profile_info,
                    "shift_days": shift_days,
                    "shift_start_time": maid.shift_start_time,
                    "shift_end_time": maid.shift_end_time,
                    "break_minutes": maid.break_minutes,
                    "created_at": maid.created_at,
                    "updated_at": maid.updated_at,
                    "username": user.username,
                    "email": user.email,
                    "account_created_at": user.date_joined,
                }
            },
            status=status.HTTP_200_OK
        )
        
# View Maid Stats Function (Admin) - allows admin to view a maid's stats

class AdminGetMaidStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)

        maid_id = request.data.get("maid_id")
        if not maid_id:
            return JsonResponse({"error": "maid_id is required."}, status=400)

        date_from = request.data.get("date_from")  # "YYYY-MM-DD"
        date_to   = request.data.get("date_to")    # "YYYY-MM-DD"

        try:
            maid = Maid.objects.get(maid_id=maid_id)
        except Maid.DoesNotExist:
            return JsonResponse({"error": "Maid not found."}, status=404)

        qs = MaidStat.objects.filter(maid=maid).order_by("-date")

        if date_from:
            df = parse_date(str(date_from))
            if not df:
                return JsonResponse({"error": "date_from must be YYYY-MM-DD."}, status=400)
            qs = qs.filter(date__gte=df)

        if date_to:
            dt = parse_date(str(date_to))
            if not dt:
                return JsonResponse({"error": "date_to must be YYYY-MM-DD."}, status=400)
            qs = qs.filter(date__lte=dt)

        stats = list(qs.values(
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
        ))

        return JsonResponse(
            {
                "stats": stats
            },
            status=status.HTTP_200_OK
        )