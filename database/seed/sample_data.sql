-- Development sample data. Run manually after V1__create_tables.sql.

INSERT INTO goal (name, description, target_date)
VALUES ('情報処理安全確保支援士', '試験合格', DATE '2026-11-22');

INSERT INTO category (goal_id, name)
SELECT id, category_name
FROM goal
CROSS JOIN (VALUES ('ネットワーク'), ('暗号'), ('認証')) AS categories(category_name)
WHERE name = '情報処理安全確保支援士';

INSERT INTO study_plan (goal_id, title, target_value, unit, due_date)
SELECT id, '過去問500問', 500, '問', DATE '2026-10-31'
FROM goal
WHERE name = '情報処理安全確保支援士';

INSERT INTO study_log (
    goal_id,
    category_id,
    study_date,
    duration_minutes,
    content,
    question_count,
    correct_count,
    incorrect_count,
    memo
)
SELECT
    goal.id,
    category.id,
    DATE '2026-09-21',
    60,
    '過去問30問',
    30,
    21,
    9,
    'IPsecが怪しい'
FROM goal
JOIN category ON category.goal_id = goal.id
WHERE goal.name = '情報処理安全確保支援士'
  AND category.name = 'ネットワーク';

