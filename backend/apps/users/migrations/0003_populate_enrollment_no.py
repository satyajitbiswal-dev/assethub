from django.db import migrations, models


def generate_enrollment_numbers(apps, schema_editor):
    User = apps.get_model('users', 'User')
    import uuid

    # Assign a unique 8-char hex string to users missing enrollment_no
    qs = User.objects.filter(enrollment_no__isnull=True) | User.objects.filter(enrollment_no='')
    for user in qs:
        # loop until a unique value is saved (very unlikely to loop more than once)
        while True:
            candidate = uuid.uuid4().hex[:8].upper()
            if not User.objects.filter(enrollment_no=candidate).exists():
                user.enrollment_no = candidate
                user.save(update_fields=['enrollment_no'])
                break


def reverse_generate(apps, schema_editor):
    User = apps.get_model('users', 'User')
    # reverse: clear the enrollment_no for all users (safe rollback)
    User.objects.update(enrollment_no=None)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_enrollment_no'),
    ]

    operations = [
        migrations.RunPython(generate_enrollment_numbers, reverse_generate),
        migrations.AlterField(
            model_name='user',
            name='enrollment_no',
            field=models.CharField(blank=True, max_length=8, null=False, unique=True),
        ),
    ]
