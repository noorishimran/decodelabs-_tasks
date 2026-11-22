"use strict";
// DecodeLabs Project 3: SkillHub API + persistent SQLite database
// Node.js 22.13+ recommended. No npm packages required.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const dataDir = path.join(__dirname, "data");
const defaultDbFile = path.join(dataDir, "skillhub.sqlite");
const cors = {
  "Access-Control-Allow-Origin": "*", // Local demo only
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function sendJSON(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...cors });
  res.end(JSON.stringify(payload, null, 2));
}

function createServer(options = {}) {
  // node:test gets an isolated in-memory database; the app gets a real file.
  const dbFile = options.dbFile || (process.env.NODE_TEST_CONTEXT ? ":memory:" : defaultDbFile);
  if (dbFile !== ":memory:") fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  const db = new DatabaseSync(dbFile);
  db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

  const seed = db.prepare("INSERT OR IGNORE INTO courses(id, title, description) VALUES (?, ?, ?)");
  seed.run(1, "Web Development", "Learn HTML, CSS and JavaScript.");
  seed.run(2, "Python Programming", "Learn Python from beginner to advanced.");
  seed.run(3, "UI/UX Design", "Learn modern website and app design.");

  const enrollmentSQL = `SELECT e.id, e.student_name AS studentName,
    e.course_id AS courseId, c.title AS courseName,
    e.level, e.goal, e.status, e.enrolled_at AS enrolledAt
    FROM enrollments e JOIN courses c ON c.id = e.course_id`;
  const getEnrollment = db.prepare(enrollmentSQL + " WHERE e.id = ?");
  const findCourse = db.prepare("SELECT id FROM courses WHERE id = ?");

  async function readJSON(req) {
    if (!(req.headers["content-type"] || "").toLowerCase().includes("application/json")) {
      return { status: 415, error: "Content-Type must be application/json" };
    }
    const chunks = [];
    let size = 0;
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 10240) return { status: 413, error: "Request body is too large" };
        chunks.push(chunk);
      }
      const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { status: 400, error: "JSON body must be an object" };
      }
      return { value };
    } catch {
      return { status: 400, error: "Invalid JSON body" };
    }
  }

  function validateEnrollment(record) {
    const { studentName, courseId, level = null, goal = "" } = record;
    if (typeof studentName !== "string" || studentName.trim().length < 2 || studentName.trim().length > 60) {
      return "studentName must contain 2 to 60 characters";
    }
    if (!Number.isInteger(courseId) || !findCourse.get(courseId)) return "Invalid courseId";
    if (level !== null && !["Beginner", "Intermediate", "Advanced"].includes(level)) {
      return "Invalid experience level";
    }
    if (typeof goal !== "string" || goal.trim().length > 160) {
      return "Learning goal must contain 160 characters or less";
    }
    if (record.status !== undefined && !["Enrolled", "Completed", "Cancelled"].includes(record.status)) {
      return "Invalid enrollment status";
    }
    return null;
  }

  const server = http.createServer(async (req, res) => {
    const urlPath = new URL(req.url, "http://localhost").pathname;
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }
    if (req.method === "GET" && urlPath === "/") {
      return sendJSON(res, 200, {
        project: "SkillHub Database API", message: "SQLite backend is running",
        endpoints: ["GET /api/health", "GET /api/courses", "GET /api/enrollments",
          "GET /api/enrollments/:id", "POST /api/enrollments",
          "PUT /api/enrollments/:id", "DELETE /api/enrollments/:id"]
      });
    }
    if (req.method === "GET" && urlPath === "/api/health") {
      db.prepare("SELECT 1").get();
      return sendJSON(res, 200, { status: "ok", database: "sqlite" });
    }
    if (req.method === "GET" && urlPath === "/api/courses") {
      const courses = db.prepare("SELECT id, title, description FROM courses ORDER BY id").all();
      return sendJSON(res, 200, { count: courses.length, courses });
    }
    if (req.method === "GET" && urlPath === "/api/enrollments") {
      const enrollments = db.prepare(enrollmentSQL + " ORDER BY e.id DESC").all();
      return sendJSON(res, 200, { count: enrollments.length, enrollments });
    }

    const match = urlPath.match(/^\/api\/enrollments\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);
      if (!Number.isSafeInteger(id) || id < 1) return sendJSON(res, 400, { error: "Invalid enrollment ID" });
      const current = getEnrollment.get(id);
      if (!current) return sendJSON(res, 404, { error: "Enrollment not found" });

      if (req.method === "GET") return sendJSON(res, 200, { enrollment: current });

      if (req.method === "PUT") {
        const parsed = await readJSON(req);
        if (parsed.error) return sendJSON(res, parsed.status, { error: parsed.error });
        if (!Object.keys(parsed.value).some(k => ["studentName", "courseId", "level", "goal", "status"].includes(k))) {
          return sendJSON(res, 400, { error: "Provide at least one field to update" });
        }
        const next = { ...current, ...parsed.value };
        const error = validateEnrollment(next);
        if (error) return sendJSON(res, 400, { error });
        try {
          db.prepare(`UPDATE enrollments SET student_name=?, course_id=?, level=?, goal=?, status=? WHERE id=?`)
            .run(next.studentName.trim(), next.courseId, next.level ?? null, next.goal.trim(), next.status, id);
        } catch (err) {
          if (String(err.message).includes("UNIQUE constraint")) {
            return sendJSON(res, 409, { error: "This student is already enrolled in that course" });
          }
          return sendJSON(res, 500, { error: "Database update failed" });
        }
        return sendJSON(res, 200, { message: "Enrollment updated successfully", enrollment: getEnrollment.get(id) });
      }
      if (req.method === "DELETE") {
        db.prepare("DELETE FROM enrollments WHERE id=?").run(id);
        return sendJSON(res, 200, { message: "Enrollment deleted successfully", id });
      }
    }

    if (req.method === "POST" && urlPath === "/api/enrollments") {
      const parsed = await readJSON(req);
      if (parsed.error) return sendJSON(res, parsed.status, { error: parsed.error });
      const record = parsed.value;
      const error = validateEnrollment(record);
      if (error) return sendJSON(res, 400, { error });
      try {
        const result = db.prepare(`INSERT INTO enrollments(student_name, course_id, level, goal)
          VALUES (?, ?, ?, ?)`).run(
            record.studentName.trim(), record.courseId, record.level ?? null, (record.goal ?? "").trim()
          );
        return sendJSON(res, 201, {
          message: "Enrollment created successfully",
          enrollment: getEnrollment.get(Number(result.lastInsertRowid))
        });
      } catch (err) {
        if (String(err.message).includes("UNIQUE constraint")) {
          return sendJSON(res, 409, { error: "This student is already enrolled in that course" });
        }
        return sendJSON(res, 500, { error: "Database insert failed" });
      }
    }
    return sendJSON(res, 404, { error: "Endpoint not found" });
  });
  server.on("close", () => db.close());
  return server;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => console.log(`SkillHub SQLite API running at http://localhost:${port}`));
}
module.exports = { createServer };
