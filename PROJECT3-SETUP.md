# SkillHub — DecodeLabs Project 3 (SQLite)

This folder contains drop-in Project 3 files for an EXISTING SkillHub project. Keep the existing index.html, style.css, script.js, README.md and Project 2 tests.

1. Check `node -v`: Node 22.13+ or newer is recommended for `node:sqlite`.
2. Copy `server.js` and `schema.sql` to the same directory as `package.json` in SkillHub. Overwrite the old server.js (make a backup first).
3. Copy `tests/database.test.js` to the existing `tests/` folder.
4. Add `data/` and `*.sqlite*` to `.gitignore` so students' data isn't committed.
5. From the SkillHub root: `npm start`.
6. Open Live Server for `index.html`; enroll a demo student.
7. Open `http://localhost:3000/api/enrollments`; restart backend and refresh: the enrollment remains.
8. Run `npm test`; the Project 3 test verifies CRUD and persistence.
9. Commit and push `server.js`, `schema.sql`, new test and documentation only, not the database file.

API endpoints:
- GET /api/courses
- GET /api/enrollments
- GET /api/enrollments/:id
- POST /api/enrollments
- PUT /api/enrollments/:id
- DELETE /api/enrollments/:id

The SQLite file is created automatically in `data/skillhub.sqlite`.
This is a local demo without authentication. Do NOT deploy the write endpoints publicly without authentication, authorization and stricter CORS.
