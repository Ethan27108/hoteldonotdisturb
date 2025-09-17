from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

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

    if username == "ethan" and password == "pass":
        return JsonResponse({"success": True, "message": "Logged in!"})
    else:
        return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)
