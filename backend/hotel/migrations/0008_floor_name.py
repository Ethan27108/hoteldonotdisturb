from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hotel', '0007_room_pos_x_room_pos_y'),
    ]

    operations = [
        migrations.AddField(
            model_name='floor',
            name='name',
            field=models.CharField(default='', max_length=255),
        ),
    ]
