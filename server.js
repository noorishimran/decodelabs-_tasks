
"use strict";

// SkillHub Full Stack Application
// DecodeLabs Project 2 - Backend API

const http = require("node:http");

// Available Courses
const courses = [
  {
    id: 1,
    title: "Web Development",
    description: "Learn HTML, CSS and JavaScript."
  },
  {
    id: 2,
    title: "Python Programming",
    description: "Learn Python from beginner to advanced."
  },
  {
    id: 3,
    title: "UI/UX Design",
    description: "Learn modern website and app design."
  }
];

// Experience Levels
const allowedLevels = [
  "Beginner",
  "Intermediate",
  "Advanced"
];

// JSON Response Helper
function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    // Local demo only. Restrict origins in production.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  res.end(JSON.stringify(payload, null, 2));
}

// Create Backend Server
function createServer() {

  // In-memory database
  const enrollments = [];
  let nextId = 1;

  return http.createServer(async (req, res) => {

    const path = new URL(
      req.url,
      "http://localhost"
    ).pathname;

    // Handle CORS
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });

      return res.end();
    }

    // Home API
    if (req.method === "GET" && path === "/") {
      return sendJSON(res, 200, {
        project: "SkillHub Full Stack Application",
        developer: "DecodeLabs Intern",
        message: "Backend API running successfully",
        version: "2.0",
        endpoints: [
          "GET /api/health",
          "GET /api/courses",
          "GET /api/enrollments",
          "POST /api/enrollments"
        ]
      });
    }

    // Health API
    if (req.method === "GET" && path === "/api/health") {
      return sendJSON(res, 200, {
        status: "ok",
        message: "SkillHub API is healthy"
      });
    }

    // GET Courses
    if (req.method === "GET" && path === "/api/courses") {
      return sendJSON(res, 200, {
        count: courses.length,
        courses
      });
    }

    // GET Enrollments
    if (req.method === "GET" && path === "/api/enrollments") {
      return sendJSON(res, 200, {
        count: enrollments.length,
        enrollments
      });
    }

    // POST Enrollment
    if (req.method === "POST" && path === "/api/enrollments") {

      const contentType = (
        req.headers["content-type"] || ""
      ).toLowerCase();

      if (!contentType.includes("application/json")) {
        return sendJSON(res, 415, {
          error: "Content-Type must be application/json"
        });
      }

      // Read Request Body
      let totalBytes = 0;
      const chunks = [];

      try {
        for await (const chunk of req) {
          totalBytes += chunk.length;

          if (totalBytes > 10240) {
            return sendJSON(res, 413, {
              error: "Request body is too large"
            });
          }

          chunks.push(chunk);
        }
      } catch {
        if (!res.headersSent) {
          sendJSON(res, 400, {
            error: "Could not read request body"
          });
        }
        return;
      }

      // Parse JSON
      let body;

      try {
        body = JSON.parse(
          Buffer.concat(chunks).toString("utf8")
        );
      } catch {
        return sendJSON(res, 400, {
          error: "Invalid JSON body"
        });
      }

      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
      ) {
        return sendJSON(res, 400, {
          error: "JSON body must be an object"
        });
      }

      // Extract Form Details
      const {
        studentName,
        courseId,
        level = null,
        goal = ""
      } = body;

      // Validate Student Name
      if (
        typeof studentName !== "string" ||
        studentName.trim().length < 2 ||
        studentName.trim().length > 60
      ) {
        return sendJSON(res, 400, {
          error: "Student name must contain 2 to 60 characters"
        });
      }

      // Validate Course
      const course = courses.find(
        c => c.id === courseId
      );

      if (!Number.isInteger(courseId) || !course) {
        return sendJSON(res, 400, {
          error: "Please select a valid course"
        });
      }

      // Validate Experience Level
      if (
        level !== null &&
        !allowedLevels.includes(level)
      ) {
        return sendJSON(res, 400, {
          error: "Please select a valid experience level"
        });
      }

      // Validate Learning Goal
      if (
        typeof goal !== "string" ||
        goal.trim().length > 160
      ) {
        return sendJSON(res, 400, {
          error: "Learning goal must contain 160 characters or less"
        });
      }

      const cleanName = studentName.trim();

      // Prevent Duplicate Enrollment
      const alreadyEnrolled = enrollments.some(
        e =>
          e.courseId === courseId &&
          e.studentName.toLowerCase() === cleanName.toLowerCase()
      );

      if (alreadyEnrolled) {
        return sendJSON(res, 409, {
          error: "This student is already enrolled in that course"
        });
      }

      // Create Enrollment Record
      const enrollment = {
        id: nextId++,
        studentName: cleanName,
        courseId,
        courseName: course.title,
        level,
        goal: goal.trim(),
        enrolledAt: new Date().toISOString(),
        status: "Enrolled"
      };

      // Save Enrollment
      enrollments.push(enrollment);

      // Success Response
      return sendJSON(res, 201, {
        message: "Enrollment created successfully",
        enrollment
      });
    }

    // Handle Unknown Endpoint
    return sendJSON(res, 404, {
      error: "Endpoint not found"
    });
  });
}

// Start Backend
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;

  createServer().listen(port, () => {
    console.log(
      `SkillHub API running at http://localhost:${port}`
    );
  });
}

module.exports = { createServer };
