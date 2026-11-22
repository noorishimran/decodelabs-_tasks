"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("../server");

test("SkillHub API GET/POST, input validation and error responses", async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  await t.test("GET /api/health returns 200", async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, "ok");
  });

  await t.test("GET /api/courses returns 3 courses", async () => {
    const res = await fetch(`${base}/api/courses`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.courses.length, 3);
  });

  await t.test("POST /api/enrollments returns 201", async () => {
    const res = await fetch(`${base}/api/enrollments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentName: "Test Student", courseId: 1 })
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.enrollment.courseName, "Web Development");
  });

  await t.test("GET /api/enrollments returns created enrollment", async () => {
    const res = await fetch(`${base}/api/enrollments`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.count, 1);
  });

  await t.test("Missing studentName returns 400", async () => {
    const res = await fetch(`${base}/api/enrollments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: 1 })
    });
    assert.equal(res.status, 400);
  });

  await t.test("Unknown courseId returns 400", async () => {
    const res = await fetch(`${base}/api/enrollments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentName: "Another Student", courseId: 999 })
    });
    assert.equal(res.status, 400);
  });

  await t.test("Repeated enrollment returns 409", async () => {
    const res = await fetch(`${base}/api/enrollments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentName: "Test Student", courseId: 1 })
    });
    assert.equal(res.status, 409);
  });

  await t.test("Invalid JSON returns 400", async () => {
    const res = await fetch(`${base}/api/enrollments`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "not-json"
    });
    assert.equal(res.status, 400);
  });

  await t.test("Missing endpoint returns 404", async () => {
    const res = await fetch(`${base}/api/not-real`);
    assert.equal(res.status, 404);
  });
});
