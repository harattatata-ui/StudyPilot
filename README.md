# StudyPilot

StudyPilot is a web application for managing learning goals, tasks, and daily study logs.

## Current milestone

The first working frontend connects directly to Supabase and supports:

- Email/password sign-up and sign-in
- Creating a subject
- Listing the signed-in user's subjects
- Row Level Security so each user can access only their own data

## Current architecture

```text
React (static frontend) -> Supabase Auth + Data API -> PostgreSQL
```

The frontend prototype is under `frontend/`. See `frontend/README.md` for local startup instructions.

A Spring Boot REST API can be introduced later when StudyPilot needs server-only business logic, external integrations, or secret-backed AI features.

## Database

The current Supabase project contains:

- `subjects`
- `study_tasks`
- `study_logs`

All three tables have RLS enabled and ownership policies based on `auth.uid() = user_id`.

Development-only sample data under `database/seed/` reflects an earlier draft schema and must not be run against the current Supabase schema.

## Security

The browser uses only the Supabase Publishable Key. Database passwords, Secret Keys, legacy service_role keys, and `.env` files must never be committed.
