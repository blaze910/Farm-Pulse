from django.db import migrations, models


def mark_existing_onboarded(apps, schema_editor):
    """Accounts that already exist are not "new" — they must never see the
    first-run subscribe dialog, only the weekly side reminder."""
    Profile = apps.get_model("accounts", "Profile")
    Profile.objects.update(onboarded=True)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="onboarded",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="profile",
            name="subscribed",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="profile",
            name="subscribe_reminder_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(mark_existing_onboarded, migrations.RunPython.noop),
    ]
