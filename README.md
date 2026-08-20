# FarmPulse — Next.js + Django + Supabase
Farmpulse is a comprehensive agricultural data platform. It leverages a high-performance Next.js frontend and a robust Django REST API backend to provide real-time insights, crop monitoring, and data-driven farm management tools.

This repository is the FarmPulse codebase — a consolidated rewrite bringing earlier prototypes into one Next.js + Django + Supabase project.

## Architecture

```text
Next.js App Router (JavaScript / JSX)
        |
        | HTTP + HttpOnly cookies
        v
Django REST API
        |
        +-- Authentication / Google OAuth / SMTP OTP
        +-- Farm zones / profiles / notifications
        +-- Weather / rainfall / soil
        +-- Crop suitability / pest risk / smart suggestions
        +-- Mock market dataset
        |
        v
Supabase PostgreSQL + Supabase Storage
```

### Non-negotiable migration rules

- Next.js App Router only.
- JavaScript and JSX only.
- Reusable JSX components live under `frontend/components/`.
- Existing CSS/design is preserved.
- No `localStorage` or `sessionStorage` for application state.
- No Supabase Auth.
- Django is the authentication authority.
- Supabase is PostgreSQL + Storage.
- Paid APIs are not required for the class project.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows PowerShell
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database schema

`backend/supabase/schema.sql` documents the intended Supabase PostgreSQL tables and avatar bucket. Django migrations remain the source of truth for the Django ORM tables when deploying a fresh environment.
