from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Min, Max
from .models import Maid, Task, CleaningLog, MaidStat
from django.db.models import Sum, Avg




def get_overall_stats_for_maid(maid):
    """
    Aggregate all MaidStat rows for this maid to compute overall stats
    across all days.

    Returns a dict with totals and averages that are sents in JSON.
    """

    qs = MaidStat.objects.filter(maid=maid)
    if not qs.exists():
        return {
            "total_days": 0,
            "total_rooms_cleaned": 0,
            "total_active_cleaning_hours": 0.0,
            "total_working_hours": 0.0,
            "avg_rooms_per_shift_overall": 0.0,
            "avg_time_per_room_overall": 0.0,
            "overall_completion_rate": 0.0,
            "total_tasks_incomplete": 0,
            "total_emergency_tasks_handled": 0,
            "total_battery_changes_performed": 0,
            "avg_on_time_shift_attendance": 0.0,
            "avg_break_usage": 0.0,
        }

    total_days = qs.count()

    agg = qs.aggregate(
        total_rooms_cleaned_sum=Sum("total_rooms_cleaned"),
        active_cleaning_hours_sum=Sum("active_cleaning_hours"),
        working_hours_sum=Sum("working_hours"),
        completion_rate_avg=Avg("completion_rate"),
        tasks_incomplete_sum=Sum("tasks_incomplete"),
        emergency_tasks_sum=Sum("emergency_tasks_handled"),
        battery_changes_sum=Sum("battery_changes_performed"),
        on_time_attendance_avg=Avg("on_time_shift_attendance"),
        break_usage_avg=Avg("break_usage"),
    )

    total_rooms_cleaned = agg["total_rooms_cleaned_sum"] or 0
    total_active_cleaning_hours = agg["active_cleaning_hours_sum"] or 0.0
    total_working_hours = agg["working_hours_sum"] or 0.0
    overall_completion_rate = agg["completion_rate_avg"] or 0.0
    total_tasks_incomplete = agg["tasks_incomplete_sum"] or 0
    total_emergency_tasks_handled = agg["emergency_tasks_sum"] or 0
    total_battery_changes_performed = agg["battery_changes_sum"] or 0
    avg_on_time_shift_attendance = agg["on_time_attendance_avg"] or 0.0
    avg_break_usage = agg["break_usage_avg"] or 0.0

    # For overall avg rooms/shift, we can approximate:
    # total rooms cleaned / number of days worked
    avg_rooms_per_shift_overall = (
        float(total_rooms_cleaned) / float(total_days)
        if total_days > 0 else 0.0
    )

    # For avg time per room overall, use a weighted average
    total_minutes_weighted = 0.0
    for stat in qs:
        # stat.avg_time_per_room is per-room minutes for that day
        total_minutes_weighted += (stat.avg_time_per_room or 0.0) * (stat.total_rooms_cleaned or 0)

    if total_rooms_cleaned > 0:
        avg_time_per_room_overall = total_minutes_weighted / float(total_rooms_cleaned)
    else:
        avg_time_per_room_overall = 0.0

    return {
        "total_days": total_days,
        "total_rooms_cleaned": total_rooms_cleaned,
        "total_active_cleaning_hours": total_active_cleaning_hours,
        "total_working_hours": total_working_hours,
        "avg_rooms_per_shift_overall": avg_rooms_per_shift_overall,
        "avg_time_per_room_overall": avg_time_per_room_overall,  # minutes
        "overall_completion_rate": overall_completion_rate,       # %
        "total_tasks_incomplete": total_tasks_incomplete,
        "total_emergency_tasks_handled": total_emergency_tasks_handled,
        "total_battery_changes_performed": total_battery_changes_performed,
        "avg_on_time_shift_attendance": avg_on_time_shift_attendance,  # %
        "avg_break_usage": avg_break_usage,                             # minutes
    }


def update_maid_stats_for_day(maid: Maid, day=None) -> MaidStat:
    """
    Recalculate all MaidStat metrics for a single maid on a given day.

    - day: datetime.date (defaults to "today" in local time if None)
    - Uses CleaningLog and Task data for that maid on that date.

    Fills:
      total_rooms_cleaned
      avg_rooms_per_shift
      avg_time_per_room (minutes)
      working_hours (hours)
      active_cleaning_hours (hours)
      completion_rate (percent, 0–100)
      tasks_incomplete
      emergency_tasks_handled
      battery_changes_performed
      on_time_shift_attendance (0 or 100 for that day)
      break_usage (uses configured break_minutes for now)
    """

    if day is None:
        day = timezone.localdate()

    # Cleaning logs for that maid and day
    logs = CleaningLog.objects.filter(
        maid=maid,
        finish_time__date=day,
        deleted_by_admin=False,
    )

    # Tasks assigned that day
    tasks = Task.objects.filter(
        maid=maid,
        assigned_time__date=day,
    )

    stat, _ = MaidStat.objects.get_or_create(maid=maid, date=day)

    # ---------- Basic counts ----------
    total_rooms_cleaned = logs.count()

    # ---------- Active cleaning time ----------
    total_cleaning_seconds = 0
    for log in logs:
        if log.start_time and log.finish_time:
            delta = log.finish_time - log.start_time
            total_cleaning_seconds += max(delta.total_seconds(), 0)

    active_cleaning_hours = total_cleaning_seconds / 3600.0
    avg_time_per_room = (
        (total_cleaning_seconds / 60.0) / total_rooms_cleaned
        if total_rooms_cleaned > 0 else 0.0
    )

    # ---------- Working hours (span from first start to last finish) ----------
    if logs.exists():
        first_start = logs.aggregate(Min("start_time"))["start_time__min"]
        last_finish = logs.aggregate(Max("finish_time"))["finish_time__max"]

        if first_start and last_finish and last_finish > first_start:
            working_hours = (last_finish - first_start).total_seconds() / 3600.0
        else:
            working_hours = 0.0
    else:
        working_hours = 0.0

    # ---------- Task completion metrics ----------
    tasks_assigned = tasks.count()
    tasks_completed = tasks.filter(status="completed").count()

    completion_rate = (
        (tasks_completed / tasks_assigned) * 100.0
        if tasks_assigned > 0 else 0.0
    )

    tasks_incomplete = tasks_assigned - tasks_completed

    # Emergency tasks handled = completed manual tasks
    emergency_tasks_handled = tasks.filter(
        status="completed",
        assignment_type="manual",
    ).count()

    # Battery changes performed
    battery_changes_performed = logs.filter(battery_changed=True).count()

    # ---------- Rooms per shift ----------
    # Per-day row: rooms cleaned that day ≈ rooms per shift that day
    avg_rooms_per_shift = float(total_rooms_cleaned)

    # ---------- On-time shift attendance (0 or 100 for that day) ----------
    on_time_shift_attendance = 0.0
    if maid.shift_start_time and logs.exists():
        first_start = logs.aggregate(Min("start_time"))["start_time__min"]
        if first_start:
            # Build scheduled shift start datetime for that day
            scheduled_dt = datetime.combine(day, maid.shift_start_time)
            if timezone.is_naive(scheduled_dt):
                scheduled_dt = timezone.make_aware(scheduled_dt, first_start.tzinfo)

            diff_minutes = abs((first_start - scheduled_dt).total_seconds()) / 60.0

            # You can tweak this tolerance; here 10 minutes late still "on time"
            on_time_shift_attendance = 100.0 if diff_minutes <= 10 else 0.0

    # ---------- Break usage ----------
    # We don't track real break start/end, so we store configured break_minutes for now
    break_usage = float(maid.break_minutes or 0)

    # ---------- Save into MaidStat ----------
    stat.total_rooms_cleaned = total_rooms_cleaned
    stat.avg_rooms_per_shift = avg_rooms_per_shift
    stat.avg_time_per_room = avg_time_per_room
    stat.working_hours = working_hours
    stat.active_cleaning_hours = active_cleaning_hours
    stat.completion_rate = completion_rate
    stat.tasks_incomplete = tasks_incomplete
    stat.emergency_tasks_handled = emergency_tasks_handled
    stat.battery_changes_performed = battery_changes_performed
    stat.on_time_shift_attendance = on_time_shift_attendance
    stat.break_usage = break_usage

    stat.save()
    return stat
