PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL COLLATE NOCASE
    CHECK (length(trim(student_name)) BETWEEN 2 AND 60),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  level TEXT CHECK (level IS NULL OR level IN ('Beginner', 'Intermediate', 'Advanced')),
  goal TEXT NOT NULL DEFAULT '' CHECK (length(goal) <= 160),
  status TEXT NOT NULL DEFAULT 'Enrolled'
    CHECK (status IN ('Enrolled', 'Completed', 'Cancelled')),
  enrolled_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (student_name, course_id)
);
