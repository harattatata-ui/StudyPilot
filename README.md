# StudyPilot

StudyPilot is a web application for managing learning goals, study plans, categories, and daily study logs.

## Ver.1 scope

- Create, view, update, and delete learning goals
- Manage plans and categories for each goal
- Record study time and optional question results
- Keep the data structured for future analytics and AI features

## Planned architecture

```text
React -> Spring Boot REST API -> PostgreSQL (Supabase)
```

## Repository structure

```text
studypilot/
├── frontend/                    # React application (next step)
├── backend/                     # Spring Boot application (next step)
│   └── src/main/resources/
│       └── db/migration/        # Flyway database migrations
├── database/seed/               # Development-only sample data
├── docs/                        # Design documents
└── README.md
```

## Database

The first migration creates four tables:

- `goal`
- `category`
- `study_plan`
- `study_log`

Flyway applies migrations in version order. Do not edit an applied migration; create a new migration such as `V2__add_xxx.sql` instead.

Development sample data is kept outside Flyway under `database/seed/` so it is not inserted automatically in production.

## Security

Database URLs, passwords, API keys, and `.env` files must not be committed to GitHub.
