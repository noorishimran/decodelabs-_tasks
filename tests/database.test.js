"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createServer } = require("../server");

async function start(dbFile) {
  const server = createServer({ dbFile });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}
const stop = server => new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
const request = async (base, endpoint, method = "GET", data) => {
  const response = await fetch(base + endpoint, {
    method,
    ...(data ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) } : {})
  });
  return { code: response.status, body: await response.json() };
};

test("Project 3: SQLite CRUD, validation and persistence", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "skillhub-test-"));
  const dbFile = path.join(dir, "test.sqlite");
  let instance;
  try {
    instance = await start(dbFile);
    const { base } = instance;
    assert.equal((await request(base, "/api/courses")).body.count, 3);
    const created = await request(base, "/api/enrollments", "POST", {
      studentName: "Demo Student", courseId: 1, level: "Beginner", goal: "Learn HTML"
    });
    assert.equal(created.code, 201);
    const id = created.body.enrollment.id;
    assert.equal((await request(base, "/api/enrollments")).body.count, 1);
    assert.equal((await request(base, "/api/enrollments", "POST", {
      studentName: "demo student", courseId: 1
    })).code, 409);
    assert.equal((await request(base, "/api/enrollments", "POST", {
      studentName: "A", courseId: 1
    })).code, 400);
    const edited = await request(base, `/api/enrollments/${id}`, "PUT", {
      status: "Completed", goal: "Completed HTML"
    });
    assert.equal(edited.code, 200);
    assert.equal(edited.body.enrollment.status, "Completed");
    await stop(instance.server);
    instance = await start(dbFile);
    const afterRestart = await request(instance.base, `/api/enrollments/${id}`);
    assert.equal(afterRestart.code, 200);
    assert.equal(afterRestart.body.enrollment.goal, "Completed HTML");
    assert.equal((await request(instance.base, `/api/enrollments/${id}`, "DELETE")).code, 200);
    assert.equal((await request(instance.base, `/api/enrollments/${id}`)).code, 404);
  } finally {
    if (instance?.server.listening) await stop(instance.server);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
