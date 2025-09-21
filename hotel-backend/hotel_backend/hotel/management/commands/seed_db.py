from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from hotel.models import Admin, Maid, Floor, Room, Task, CleaningLog, RoomStatusLog, MaidStat
from faker import Faker
import random
from datetime import timedelta


class Command(BaseCommand):
    help = "Seed hotel_db with structured test data (admins, maids, floors, rooms, logs, stats)"

    def handle(self, *args, **kwargs):
        fake = Faker()

        # clear old data
        Admin.objects.all().delete()
        Maid.objects.all().delete()
        Floor.objects.all().delete()
        Room.objects.all().delete()
        Task.objects.all().delete()
        CleaningLog.objects.all().delete()
        RoomStatusLog.objects.all().delete()
        MaidStat.objects.all().delete()
        User.objects.all().exclude(is_superuser=True).delete()

        # 1 admin user + admin profile
        admin_user = User.objects.create_user(
            username="admin1",
            email="admin@hotel.com",
            password="admin123"
        )
        admin = Admin.objects.create(
            user=admin_user,
            name="System Admin"
        )

        # 5 floors
        floors = []
        for f in range(1, 6):
            floor = Floor.objects.create(
                floor_number=f,
                created_by=admin
            )
            floors.append(floor)

        # 4 rooms per floor
        rooms = []
        for floor in floors:
            for r in range(1, 5):
                room = Room.objects.create(
                    room_number=floor.floor_number * 100 + r,
                    floor=floor,
                    status=random.choice([
                        "clean",
                        "dirty",
                        "do_not_disturb",
                        "cleaning_in_progress",
                        "emergency_clean"
                    ]),
                    battery_indicator=random.randint(10, 100),
                    battery_last_checked=fake.date_time_this_month()
                )
                rooms.append(room)

        # 10 maids (each with User + Maid profile)
        maids = []
        for i in range(10):
            maid_user = User.objects.create_user(
                username=f"maid{i+1}",
                email=f"maid{i+1}@hotel.com",
                password="maid123"
            )
            maid = Maid.objects.create(
                user=maid_user,
                name=fake.name(),
                shift_day=random.choice(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
                shift_start_time="09:00",
                shift_end_time="17:00",
                break_minutes=30
            )
            maids.append(maid)

        # tasks + cleaning logs (30 tasks)
        for _ in range(30):
            maid = random.choice(maids)
            room = random.choice(rooms)
            assigned_time = fake.date_time_this_month()
            start_time = assigned_time + timedelta(minutes=random.randint(1, 10))
            finish_time = start_time + timedelta(minutes=random.randint(10, 30))

            task = Task.objects.create(
                room=room,
                maid=maid,
                assignment_type=random.choice(["auto", "manual"]),
                status=random.choice(["pending", "in_progress", "completed"]),
                assigned_time=assigned_time,
                start_time=start_time,
                finish_time=finish_time,
                battery_change_required=random.choice([True, False])
            )

            CleaningLog.objects.create(
                task=task,
                maid=maid,
                room=room,
                report=fake.sentence(),
                assigned_time=assigned_time,
                start_time=start_time,
                finish_time=finish_time,
                battery_changed=random.choice([True, False])
            )

        # room status logs (2–3 per room)
        for room in rooms:
            for _ in range(random.randint(2, 3)):
                RoomStatusLog.objects.create(
                    room=room,
                    status=random.choice([
                        "clean",
                        "dirty",
                        "do_not_disturb",
                        "cleaning_in_progress",
                        "emergency_clean"
                    ]),
                    changed_by=random.choice(["system", "admin", "maid", "guest"]),
                    timestamp=fake.date_time_this_month()
                )

        # maid stats (1 per maid)
        for maid in maids:
            MaidStat.objects.create(
                maid=maid,
                date=fake.date_this_month(),
                total_rooms_cleaned=random.randint(5, 20),
                avg_rooms_per_shift=random.uniform(2, 6),
                avg_time_per_room=random.uniform(10, 25),
                working_hours=random.uniform(6, 8),
                active_cleaning_hours=random.uniform(3, 6),
                completion_rate=random.uniform(0.7, 1.0),
                tasks_incomplete=random.randint(0, 3),
                emergency_tasks_handled=random.randint(0, 2),
                battery_changes_performed=random.randint(0, 3),
                on_time_shift_attendance=random.uniform(0.8, 1.0),
                break_usage=random.uniform(0.5, 1.5)
            )

        self.stdout.write(
            self.style.SUCCESS(
                "hotel_db seeded with:\n"
                "- 1 admin (username: admin1, password: admin123)\n"
                "- 10 maids (username: maid1..maid10, password: maid123)\n"
                "- 5 floors, 20 rooms, tasks, logs, and stats (all with names)"
            )
        )
