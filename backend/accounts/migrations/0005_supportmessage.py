# Generated manually to accompany the SupportMessage model added for
# Resend's inbound email webhook (support@farmpulse.name.ng).
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_emailchangerequest'),
    ]

    operations = [
        migrations.CreateModel(
            name='SupportMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('resend_email_id', models.CharField(db_index=True, max_length=100, unique=True)),
                ('from_email', models.EmailField(max_length=254)),
                ('to_email', models.EmailField(blank=True, max_length=254)),
                ('subject', models.CharField(blank=True, max_length=500)),
                ('text_body', models.TextField(blank=True)),
                ('html_body', models.TextField(blank=True)),
                ('forwarded', models.BooleanField(default=False)),
                ('received_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-received_at'],
            },
        ),
    ]
