from django.db import models
from django.contrib.auth.models import User

class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    admin_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Maid(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    maid_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    profile_info = models.TextField(null=True, blank=True)
    shift_day = models.CharField(max_length=20, null=True, blank=True)
    shift_start_time = models.TimeField(null=True, blank=True)
    shift_end_time = models.TimeField(null=True, blank=True)
    break_minutes = models.IntegerField(default=0, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Floor(models.Model):
    floor_id = models.AutoField(primary_key=True)
    floor_number = models.IntegerField()
    created_by = models.ForeignKey(Admin, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Room(models.Model):
    room_id = models.AutoField(primary_key=True)
    room_number = models.IntegerField()
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=30,
        choices=[
            ("clean", "Clean"),
            ("do_not_disturb", "Do Not Disturb"),
            ("cleaning_in_progress", "Cleaning in Progress"),
            ("emergency_clean", "Emergency Clean"),
            ("dirty", "Dirty"),
        ],
    )
    battery_indicator = models.IntegerField(default=100)  # percentage
    battery_last_checked = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class Task(models.Model):
    task_id = models.AutoField(primary_key=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    maid = models.ForeignKey(Maid, on_delete=models.CASCADE)
    assignment_type = models.CharField(
        max_length=20,
        choices=[("auto", "Automatic"), ("manual", "Manual")]
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("in_progress", "In Progress"),
            ("completed", "Completed"),
        ]
    )
    assigned_time = models.DateTimeField()
    start_time = models.DateTimeField(null=True, blank=True)
    finish_time = models.DateTimeField(null=True, blank=True)
    battery_change_required = models.BooleanField(default=False)


class CleaningLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    maid = models.ForeignKey(Maid, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    report = models.TextField(null=True, blank=True)
    assigned_time = models.DateTimeField()
    start_time = models.DateTimeField()
    finish_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_by_admin = models.BooleanField(default=False)
    battery_changed = models.BooleanField(default=False)


class RoomStatusLog(models.Model):
    room_log_id = models.AutoField(primary_key=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=30,
        choices=[
            ("clean", "Clean"),
            ("do_not_disturb", "Do Not Disturb"),
            ("cleaning_in_progress", "Cleaning in Progress"),
            ("emergency_clean", "Emergency Clean"),
        ],
    )
    changed_by = models.CharField(max_length=50)  # system/admin/maid/guest
    timestamp = models.DateTimeField(auto_now_add=True)


class MaidStat(models.Model):
    stat_id = models.AutoField(primary_key=True)
    maid = models.ForeignKey(Maid, on_delete=models.CASCADE)
    date = models.DateField()
    total_rooms_cleaned = models.IntegerField(default=0)
    avg_rooms_per_shift = models.FloatField(default=0)
    avg_time_per_room = models.FloatField(default=0)  # in minutes
    working_hours = models.FloatField(default=0)
    active_cleaning_hours = models.FloatField(default=0)
    completion_rate = models.FloatField(default=0)
    tasks_incomplete = models.IntegerField(default=0)
    emergency_tasks_handled = models.IntegerField(default=0)
    battery_changes_performed = models.IntegerField(default=0)
    on_time_shift_attendance = models.FloatField(default=0)  # percentage
    break_usage = models.FloatField(default=0)  # minutes
