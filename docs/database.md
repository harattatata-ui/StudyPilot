# Database design notes

## Relationships

- One `goal` has many `category` rows.
- One `goal` has many `study_plan` rows.
- One `goal` has many `study_log` rows.
- One `category` has many `study_log` rows.
- `study_log.category_id` is optional.

## Important rules

- A category name cannot be duplicated within the same goal.
- A study log category must belong to the selected goal.
- Deleting a goal deletes its categories, plans, and logs.
- Deleting a category keeps its logs and sets their `category_id` to `NULL`.
- Applied Flyway migration files are immutable; schema changes use a new versioned file.

