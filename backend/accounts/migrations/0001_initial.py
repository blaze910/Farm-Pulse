# Generated as part of the FarmPulse migration. Run `python manage.py makemigrations`
# after installing dependencies if your Django version regenerates this file.
from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]
    operations = [
        migrations.CreateModel(name="CustomUser", fields=[
            ("password", models.CharField(max_length=128, verbose_name="password")),
            ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
            ("is_superuser", models.BooleanField(default=False, help_text="Designates that this user has all permissions without explicitly assigning them.", verbose_name="superuser status")),
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("email", models.EmailField(max_length=255, unique=True)),
            ("is_active", models.BooleanField(default=True)),
            ("is_staff", models.BooleanField(default=False)),
            ("date_joined", models.DateTimeField(auto_now_add=True)),
            ("groups", models.ManyToManyField(blank=True, related_name="customuser_set", related_query_name="customuser", to="auth.group", verbose_name="groups")),
            ("user_permissions", models.ManyToManyField(blank=True, related_name="customuser_set", related_query_name="customuser", to="auth.permission", verbose_name="user permissions")),
        ], options={"abstract": False}),
        migrations.CreateModel(name="Profile", fields=[
            ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name="profile", serialize=False, to="accounts.customuser")),
            ("username", models.CharField(blank=True, max_length=40, null=True)),
            ("display_name", models.CharField(blank=True, max_length=60, null=True)),
            ("avatar_path", models.CharField(blank=True, max_length=500, null=True)),
            ("pest_alerts", models.BooleanField(default=True)),
            ("weekly_digest", models.BooleanField(default=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
        ]),
        migrations.CreateModel(name="UserRole", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("role", models.CharField(default="user", max_length=32)),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="roles", to="accounts.customuser")),
        ], options={"constraints":[models.UniqueConstraint(fields=("user","role"), name="unique_user_role")]}),
        migrations.CreateModel(name="OTPCode", fields=[
            ("id", models.BigAutoField(primary_key=True, serialize=False)),
            ("email", models.EmailField(max_length=255)),
            ("hashed_code", models.CharField(max_length=255)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("expires_at", models.DateTimeField()),
            ("attempts", models.PositiveIntegerField(default=0)),
            ("max_attempts", models.PositiveIntegerField(default=5)),
            ("used", models.BooleanField(default=False)),
            ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="accounts.customuser")),
        ]),
        migrations.CreateModel(name="PasswordResetToken", fields=[
            ("id", models.BigAutoField(primary_key=True, serialize=False)),
            ("hashed_token", models.CharField(max_length=255)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("expires_at", models.DateTimeField()),
            ("used", models.BooleanField(default=False)),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="accounts.customuser")),
        ]),
        migrations.CreateModel(name="Zone", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("name", models.CharField(max_length=100)),
            ("region", models.CharField(blank=True, max_length=160)),
            ("lat", models.FloatField()), ("lon", models.FloatField()),
            ("hectares", models.DecimalField(decimal_places=2, default=1, max_digits=10)),
            ("crop", models.CharField(default="maize", max_length=40)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="zones", to="accounts.customuser")),
        ]),
        migrations.CreateModel(name="Notification", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("title", models.CharField(max_length=160)), ("body", models.TextField()),
            ("kind", models.CharField(choices=[("info","Info"),("warning","Warning"),("critical","Critical"),("digest","Digest")], default="info", max_length=20)),
            ("read", models.BooleanField(default=False)), ("created_at", models.DateTimeField(auto_now_add=True)),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notifications", to="accounts.customuser")),
        ]),
    ]
