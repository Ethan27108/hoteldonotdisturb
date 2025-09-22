from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import SignUpForm
from .models import Maid, Admin
from django.contrib.auth.views import LoginView
from django.contrib import messages
from .forms import CustomLoginForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import time

#Login Function
class RoleLoginView(LoginView):
    authentication_form = CustomLoginForm
    template_name = "registration/login.html"

    def form_valid(self, form):
        
        user = form.get_user()
        role = form.cleaned_data["role"]

        # check role against related models
        if role == "maid" and not hasattr(user, "maid"):
            messages.error(self.request, "This account is not registered as a Maid.")
            return JsonResponse({"success": False, "message": "Invalid maid"}, status=401)
        if role == "admin" and not hasattr(user, "admin"):
            messages.error(self.request, "This account is not registered as an Admin.")
            return JsonResponse({"success": False, "message": "Invalid admin"}, status=401)

        
        login(self.request, user)
        return JsonResponse({"success": True, "message": "Logged in!"})
        return redirect("dashboard") 

    def form_invalid(self, form):
        messages.error(self.request, "Invalid username or password.")
        return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)

from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'detail': 'CSRF cookie set'})

@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=400)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get("username")
    password = data.get("password")

    #if this is in database and password matches, return success

    if username == "ethan" and password == "pass":
        return JsonResponse({"success": True, "message": "Logged in!"})
    else:
        return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)


@login_required
def dashboard(request):
    return render(request, "dashboard.html")



#Deactivate Account Function
@login_required
def delete_account(request):
    user = request.user

    user.is_active = False
    user.save()

    logout(request)

    return redirect("login")

#Remove Account (Delete) Permanently Function
@login_required
def remove_account(request):
    if request.method == "POST":
        user = request.user

        logout(request)

        user.delete()

        return redirect("login")


# Signup Function
def signup_view(request):
    if request.method == "POST":
        form = SignUpForm(request.POST)
        if form.is_valid():
            
            user = form.save(commit=False)
            user.email = form.cleaned_data["email"]
            user.save()

            role = form.cleaned_data["role"]
            name = form.cleaned_data["name"]
            profile_info = form.cleaned_data.get("profile_info", "")

            
            if role == "maid":
                Maid.objects.create(user=user, name=name, profile_info=profile_info)
                messages.success(request, "Maid account created! Please log in.")
            elif role == "admin":
                Admin.objects.create(user=user, name=name)
                messages.success(request, "Admin account created! Please log in.")

            return redirect("login")  
    else:
        form = SignUpForm()

    return render(request, "registration/signup.html", {"form": form})

@login_required
def dashboard_view(request):
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=400)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    username = data.get("username")
    return JsonResponse([{"roomNum": 101}, {"roomNum": 102}, {"roomNum": 103}], safe=False)

@login_required
def cleanStart(request):
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=400)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    username = data.get("username")
    room = data.get("room")
    currentTime = time.time()
    try:
        return JsonResponse("worked as expected", safe=False)
    except Exception as e:
        return JsonResponse({"error": "Database couldnt handle it"}, status=400)
    
@login_required
def cleanEnd(request):
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=400)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    username = data.get("username")
    room = data.get("room")
    currentTime = time.time()
    try:
        return JsonResponse("worked as expected", safe=False)
    except Exception as e:
        return JsonResponse({"error": "Database couldnt handle it"}, status=400)
