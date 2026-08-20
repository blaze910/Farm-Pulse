import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """
    Create (or update the password of) a superuser from environment
    variables, without needing interactive input or Render Shell access
    (which isn't available on the free instance tier).

    Reads:
      DJANGO_SUPERUSER_EMAIL
      DJANGO_SUPERUSER_PASSWORD

    Safe to run on every deploy: if the account already exists, it just
    makes sure it's still active/staff/superuser and leaves the password
    alone, unless DJANGO_SUPERUSER_PASSWORD has changed, in which case it
    updates it. If either env var is missing, this command does nothing
    (so it's safe to leave wired into the build command permanently —
    remove or blank out the env vars once you've logged in, and it becomes
    a no-op on subsequent deploys).
    """

    help = "Create or update the admin superuser from DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD env vars."

    def handle(self, *args, **options):
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip().lower()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")

        if not email or not password:
            self.stdout.write("DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD not set — skipping.")
            return

        User = get_user_model()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"is_staff": True, "is_superuser": True, "is_active": True},
        )

        changed = False
        if not user.is_staff:
            user.is_staff = True
            changed = True
        if not user.is_superuser:
            user.is_superuser = True
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True

        # Only (re)set the password on first creation. If you need to
        # rotate the password later, change DJANGO_SUPERUSER_PASSWORD and
        # also bump DJANGO_SUPERUSER_FORCE_PASSWORD_RESET=1 for one deploy
        # so this doesn't silently overwrite a password you've since
        # changed by hand in /admin/.
        force_reset = os.environ.get("DJANGO_SUPERUSER_FORCE_PASSWORD_RESET") == "1"
        if created or force_reset:
            user.set_password(password)
            changed = True

        if changed:
            user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created superuser {email}."))
        elif force_reset:
            self.stdout.write(self.style.SUCCESS(f"Reset password for existing superuser {email}."))
        else:
            self.stdout.write(f"Superuser {email} already exists — left password untouched.")
