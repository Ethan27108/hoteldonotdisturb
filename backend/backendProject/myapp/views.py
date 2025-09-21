from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import time
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
@csrf_exempt   
def dashboard_view(request):
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=400)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    username = data.get("username")
    return JsonResponse([{"roomNum": 101}, {"roomNum": 102}, {"roomNum": 103}], safe=False)

@csrf_exempt   
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
    
@csrf_exempt   
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
