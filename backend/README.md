# FarmPulse Django backend

Django + Django REST Framework backend for the FarmPulse smart farming dashboard.

## Responsibilities

- Django-managed email/password authentication
- Google OAuth callback flow
- SMTP six-digit password-reset OTP
- HttpOnly JWT cookies
- Profiles, zones and notifications
- Open-Meteo location/weather data
- SoilGrids soil data
- Django-derived rainfall metrics
- Crop suitability rules
- Pest-risk rules
- Smart suggestions based on current farm data
- Clearly labelled mock market data when no paid feed is configured
- Supabase PostgreSQL and Storage integration

Supabase Auth is intentionally not used.

## API groups

- `/api/v1/accounts/` — authentication, profiles, zones, notifications
- `/api/v1/places/` — location search
- `/api/v1/snapshot/` — combined weather, soil, suitability, pest and tips
- `/api/v1/market/` — market dataset
- `/api/v1/health/` — health check
