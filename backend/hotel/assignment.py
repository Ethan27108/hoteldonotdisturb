import json
from datetime import datetime
from django.utils import timezone
from .models import Maid, Room, Task
from datetime import timedelta
from .models import Room, CleaningLog, RoomStatusLog


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
    Works whether shift_day is a JSONField (list) or a JSON string.
    """
    days = maid.shift_day
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
    Returns True if the maid is available RIGHT NOW:
    - user is active
    - today is one of their shift days
    - current time is within [shift_start_time, shift_end_time]
    """
    if not maid.user.is_active:
        return False

    now = now or timezone.localtime()
    today_name = now.strftime("%A")  # "Monday", "Tuesday", etc.

    shift_days = _get_shift_days(maid)
    if today_name not in shift_days:
        return False

    if not maid.shift_start_time or not maid.shift_end_time:
        return False

    # Build datetimes for today's shift window
    start_dt = datetime.combine(now.date(), maid.shift_start_time)
    end_dt = datetime.combine(now.date(), maid.shift_end_time)

    # Attach timezone
    tz = now.tzinfo or timezone.get_current_timezone()
    start_dt = tz.localize(start_dt) if start_dt.tzinfo is None else start_dt
    end_dt = tz.localize(end_dt) if end_dt.tzinfo is None else end_dt

    # If end <= start, treat as invalid (no overnight shifts for now)
    if end_dt <= start_dt:
        return False

    return start_dt <= now <= end_dt


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

    candidates = Maid.objects.select_related("user").all()
    scored = []

    for maid in candidates:
        if not is_maid_available(maid, now=now):
            continue

        current_floor = get_maid_current_floor(maid)
        room_floor = room.floor.floor_number if room.floor else 0

        if current_floor is None:
            distance = 999  # no known floor, treat as far
        else:
            distance = abs(current_floor - room_floor)

        pending_count = Task.objects.filter(maid=maid, status="pending").count()

        scored.append((distance, pending_count, maid.maid_id, maid))

    if not scored:
        return None

    scored.sort(key=lambda x: (x[0], x[1], x[2]))
    return scored[0][3]  # return Maid instance


def assign_room_to_best_maid(room, assignment_type="auto", now=None):
    """
    Core assignment function for normal (non-emergency) tasks.

    - If the room already has a pending or in-progress task, do nothing.
    - Finds the best available maid.
    - Creates a new Task with:
        assignment_type = "auto" or "manual"
        status = "pending"
        assigned_time = now
    - Returns the created Task or None if no suitable maid.
    """
    # Don't create duplicate tasks for the same room
    if Task.objects.filter(room=room, status__in=["pending", "in_progress"]).exists():
        return None

    now = now or timezone.localtime()

    if assignment_type not in ["auto", "manual"]:
        assignment_type = "auto"

    maid = choose_best_maid_for_room(room, now=now)
    if maid is None:
        # No available maid right now
        return None

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
