# FarmPulse frontend

Next.js App Router + JavaScript/JSX frontend.

## Structure

- `app/` — route entry points only.
- `components/` — reusable JSX and UI components.
- `hooks/` — React hooks.
- `lib/` — frontend API/data helpers.
- `public/` — static assets.

The frontend does not authenticate with Supabase. It communicates with Django using `credentials: include`; Django owns authentication and sets HttpOnly cookies.
