from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import SignUpForm
from .models import Maid, Admin
from django.contrib.auth.views import LoginView
from django.contrib import messages
from .forms import CustomLoginForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout



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
            return redirect("login")
        if role == "admin" and not hasattr(user, "admin"):
            messages.error(self.request, "This account is not registered as an Admin.")
            return redirect("login")

        
        login(self.request, user)
        return redirect("dashboard") 

    def form_invalid(self, form):
        messages.error(self.request, "Invalid username or password.")
        return redirect("login")


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