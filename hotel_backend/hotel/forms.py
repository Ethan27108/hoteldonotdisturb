from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.contrib.auth.forms import AuthenticationForm

ROLE_CHOICES = (
    ('maid', 'Maid'),
    ('admin', 'Admin'),
)

class CustomLoginForm(AuthenticationForm):
    role = forms.ChoiceField(choices=ROLE_CHOICES, required=True)
    
    
class SignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)
    role = forms.ChoiceField(choices=ROLE_CHOICES, required=True)

    name = forms.CharField(max_length=100, required=True)

    profile_info = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 2}),
        required=False,
        help_text="Only required for maids."
    )

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2", "role", "name", "profile_info")

    def clean(self):
        cleaned_data = super().clean()
        role = cleaned_data.get("role")
        profile_info = cleaned_data.get("profile_info")

        if role == "maid" and not profile_info:
            self.add_error("profile_info", "Profile info is required for maids.")
        return cleaned_data