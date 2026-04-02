import json
from datetime import datetime
from django.utils import timezone
from .models import Maid, Room, Task
from datetime import timedelta
from .models import Room, CleaningLog, RoomStatusLog
from zoneinfo import ZoneInfo

HOTEL_TZ = ZoneInfo("America/Toronto")


def mark_stale_rooms_dirty(threshold_hours=48, now=None):
    """
    Automatically marks rooms as 'dirty' if they have not been cleaned
    for at least `threshold_hours` (default 48 hours).

    Rules:
    - Uses CleaningLog.finish_time as the "last cleaned" timestamp.
    - Skips rooms in states where auto-dirty makes no sense:
        * cleaning_in_progress
        * emergency_clean
        * dirty
    - When a room becomes dirty by this rule:
        * Room.status = "dirty"
        * RoomStatusLog entry (changed_by="system")
        * assign_room_to_best_maid() is called automatically

    Called e.g. inside MaidTaskQueueView on every request.
    """

    now = now or timezone.localtime()
    cutoff = now - timedelta(hours=threshold_hours)

    # Get all rooms (fine for capstone scale)
    rooms = Room.objects.select_related("floor").all()

    for room in rooms:

        # Skip rooms that should not be auto-marked dirty
        if room.status in ["cleaning_in_progress", "emergency_clean", "dirty"]:
            continue

        # Get the last cleaning log for this room
        last_log = (
            CleaningLog.objects.filter(room=room, finish_time__isnull=False)
            .order_by("-finish_time")
            .first()
        )

        # If no history, skip for now to avoid surprising behavior
        if not last_log:
            continue

        # If last cleaning is older than threshold → mark as dirty
        if last_log.finish_time <= cutoff:
            room.status = "dirty"
            room.save(update_fields=["status", "updated_at"])

            RoomStatusLog.objects.create(
                room=room,
                status="dirty",
                changed_by="system",   # system auto-dirty event
            )

            # Let the algorithm assign it immediately
            assign_room_to_best_maid(room, assignment_type="auto", now=now)


def _get_shift_days(maid):
    """
    Safely returns shift days as a list of weekday names, e.g. ["Monday", "Wednesday"].
    Works whether shift_days is a JSONField (list) or a JSON string.
    """
    days = maid.shift_days
    if not days:
        return []

    if isinstance(days, list):
        return days

    # if stored as string, try to parse
    if isinstance(days, str):
        try:
            parsed = json.loads(days)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            return []

    return []


def is_maid_available(maid, now=None):
    """
    Returns True if the maid is available RIGHT NOW (in hotel local time).

    Conditions (all must be true):
    - user is active
    - shift_days is configured and today is one of them
    - shift_start_time and shift_end_time are configured
    - current local time is within [shift_start_time, shift_end_time]
    """

    # 1) Get a datetime and ALWAYS convert it to hotel-local
    if now is None:
        now = timezone.now()
    now = now.astimezone(HOTEL_TZ)

    current_time = now.time()
    today_abbr = now.strftime("%a")  # "Mon", "Tue", "Wed", ...

    print(f"[is_maid_available] Checking maid {maid.maid_id} ({maid.name}) at {now} (hotel local)")
    print(f"[is_maid_available]   current_time={current_time}, today={today_abbr}")

    # 0) Active user?
    if not maid.user.is_active:
        print(f"[is_maid_available] -> False (user not active)")
        return False

    # 1) SHIFT DAYS
    shift_days = _get_shift_days(maid)  # e.g. ["Mon","Wed","Fri"] or ["Monday","Tuesday"]
    print(f"[is_maid_available]   raw shift_days={shift_days}")

    if not shift_days:
        print("[is_maid_available] -> False (no shift_days configured)")
        return False

    normalized_days = []
    for d in shift_days:
        if not d:
            continue
        normalized_days.append(str(d).strip()[:3].title())

    print(f"[is_maid_available]   normalized_days={normalized_days}, today={today_abbr}")

    if today_abbr not in normalized_days:
        print("[is_maid_available] -> False (today not in shift_days)")
        return False

    # 2) SHIFT TIMES
    if not maid.shift_start_time or not maid.shift_end_time:
        print("[is_maid_available] -> False (missing shift_start_time or shift_end_time)")
        return False

    start_t = maid.shift_start_time
    end_t = maid.shift_end_time
    print(f"[is_maid_available]   start_t={start_t}, end_t={end_t}")

    if end_t <= start_t:
        print("[is_maid_available] -> False (end_t <= start_t, invalid window)")
        return False

    if not (start_t <= current_time <= end_t):
        print("[is_maid_available] -> False (current_time not in [start_t, end_t])")
        return False

    print("[is_maid_available] -> True")
    return True

def get_maid_current_floor(maid):
    """
    Heuristic for where the maid currently is:
    - Prefer last in_progress or pending task
    - Fall back to last completed task
    - Returns floor_number or None
    """
    task = (
        Task.objects.select_related("room__floor")
        .filter(maid=maid)
        .exclude(status="completed")
        .order_by("-assigned_time")
        .first()
    )

    if not task:
        task = (
            Task.objects.select_related("room__floor")
            .filter(maid=maid, status="completed")
            .order_by("-finish_time")
            .first()
        )

    if task and task.room and task.room.floor:
        return task.room.floor.floor_number

    return None

def choose_best_maid_for_room(room, now=None):
    """
    Among all maids that are currently available:
    - First minimize distance in floors
    - Then minimize number of pending tasks
    - Then maid_id as stable tiebreaker
    Returns a Maid or None.
    """
    now = now or timezone.localtime()
    print(f"[choose_best_maid_for_room] For room {room.room_number} at {now}")

    candidates = Maid.objects.select_related("user").all()
    scored = []

    for maid in candidates:
        available = is_maid_available(maid, now=now)
        print(f"[choose_best_maid_for_room]   maid {maid.maid_id} available={available}")
        if not available:
            continue

        current_floor = get_maid_current_floor(maid)
        room_floor = room.floor.floor_number if room.floor else 0

        if current_floor is None:
            # Maid has no recent task history → no known floor.
            # Treat unknown location as a moderate distance instead of an extreme value (999).
            # Using a huge sentinel (999) makes unknown maids always lose to any maid
            # with a known location even if that maid is heavily loaded. Use a
            # reasonable default so load (pending_count) remains meaningful.
            distance = 0
            print(f"[choose_best_maid_for_room]   maid {maid.maid_id} has no known floor; using distance={distance}")
        else:
            distance = abs(current_floor - room_floor)

        pending_count = Task.objects.filter(maid=maid, status="pending").count()

        print(
            f"[choose_best_maid_for_room]   maid {maid.maid_id} distance={distance}, "
            f"pending_count={pending_count}"
        )

        scored.append((distance, pending_count, maid.maid_id, maid))

    if not scored:
        print("[choose_best_maid_for_room] No available maids → returning None")
        return None

    scored.sort(key=lambda x: (x[0], x[1], x[2]))
    best = scored[0][3]
    print(f"[choose_best_maid_for_room] Selected maid {best.maid_id}")
    return best


from django.db.models import Count

def assign_room_to_best_maid(room, assignment_type="auto", now=None):
    """
    Core assignment function for assigning a task to a maid.

    - If the room already has a pending or in-progress task, do nothing.
    - Uses choose_best_maid_for_room(room, now=now), which respects:
        * shift_days
        * shift_start_time / shift_end_time
        * basic distance heuristic & load
    - If no suitable maid is available right now, returns None and does NOT create a task.
    """

    # Don't create duplicate tasks for the same room
    if Task.objects.filter(room=room, status__in=["pending", "in_progress"]).exists():
        print(f"[assign_room_to_best_maid] Room {room.room_number} already has a pending/in_progress task → skipping")
        return None

    now = now or timezone.localtime()

    if assignment_type not in ["auto", "manual"]:
        assignment_type = "auto"

    print(f"[assign_room_to_best_maid] called for room {room.room_number} with type={assignment_type} at {now}")

    maid = choose_best_maid_for_room(room, now=now)
    if maid is None:
        print("[assign_room_to_best_maid] No available maid right now → no task created")
        return None

    print(f"[assign_room_to_best_maid] selected maid {maid.maid_id}")

    task = Task.objects.create(
        room=room,
        maid=maid,
        assignment_type=assignment_type,
        status="pending",
        assigned_time=now,
        start_time=None,
        finish_time=None,
        battery_change_required=False,
    )

    print(
        f"[assign_room_to_best_maid] Created task {task.task_id} for maid {maid.maid_id} "
        f"on room {room.room_number}, type={assignment_type}"
    )

    return task


def rebalance_pending_tasks_for_maid(maid, now=None):
    """
    Used when a maid becomes unavailable (deactivated, deleted, shift end, etc.).
    - Takes all PENDING tasks for that maid.
    - For each, deletes the task and reassigns the room to the best available maid.
    - Keeps the original assignment_type (manual/auto).
    """
    now = now or timezone.localtime()

    tasks = list(
        Task.objects.filter(maid=maid, status="pending").select_related("room")
    )
    if not tasks:
        return

    # Delete old tasks so new assignments are clean
    Task.objects.filter(task_id__in=[t.task_id for t in tasks]).delete()

    for t in tasks:
        # Reuse assignment_type (manual vs auto)
        assign_room_to_best_maid(t.room, assignment_type=t.assignment_type, now=now)


def rebalance_all_pending_tasks(now=None):
    """
    Global rebalance (optional, heavier):
    - Used after big structural changes like:
        * many shift changes
        * adding a new maid to the team
    - Takes all PENDING AUTO tasks, deletes them,
      then reassigns rooms according to current availability.
    - Manual (emergency) tasks are left untouched.
    """
    now = now or timezone.localtime()

    tasks = list(
        Task.objects.filter(status="pending", assignment_type="auto").select_related(
            "room"
        )
    )
    if not tasks:
        return

    Task.objects.filter(task_id__in=[t.task_id for t in tasks]).delete()

    for t in tasks:
        assign_room_to_best_maid(t.room, assignment_type="auto", now=now)
