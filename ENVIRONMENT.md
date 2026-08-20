# FarmPulse environment setup

## Frontend

Create `frontend/.env.local` from `frontend/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

No database, SMTP, Google, or Supabase secret belongs in the Next.js environment file.

## Backend

Create `backend/.env` from `backend/.env.example`.

You will need:

1. **Django secret** — generate a strong random value.
2. **Supabase project URL** — Supabase dashboard → Project Settings → API.
3. **Supabase service-role key** — Supabase dashboard → Project Settings → API. Keep this server-side only.
4. **Supabase PostgreSQL connection string** — Supabase dashboard → Connect → PostgreSQL connection string.
5. **Google OAuth credentials** — Google Cloud Console → OAuth client credentials. Add the callback URL shown in `.env.example` to the authorized redirect URIs.
6. **SMTP credentials** — an SMTP provider and, for Gmail, an app password rather than your normal account password.
7. **Optional market API credentials** — not required for the class project. If left blank, FarmPulse uses its labelled demo market dataset.

## Important security rule

Never put `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_OAUTH_CLIENT_SECRET`, SMTP passwords, or `DATABASE_URL` in the frontend.
