const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { after, afterEach, before, test } = require("node:test");

const Lesson = require("../src/models/Lesson");
const controller = require("../src/controllers/lessonController");
const { requireApprovedTeacher } = require("../src/middleware/requireRole");
const { AUTH_COOKIE_NAME } = require("../src/utils/authConfig");

const teacherA = {
  id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  role: "teacher",
  approvalStatus: "approved",
  isActive: true,
};
const teacherB = {
  id: "bbbbbbbbbbbbbbbbbbbbbbbb",
  role: "teacher",
  approvalStatus: "approved",
  isActive: true,
};
const roles = {
  teacherA,
  teacherB,
  student: {
    id: "cccccccccccccccccccccccc",
    role: "student",
    approvalStatus: "approved",
    isActive: true,
  },
  pending: {
    id: "dddddddddddddddddddddddd",
    role: "teacher",
    approvalStatus: "pending",
    isActive: true,
  },
  rejected: {
    id: "eeeeeeeeeeeeeeeeeeeeeeee",
    role: "teacher",
    approvalStatus: "rejected",
    isActive: true,
  },
  inactive: {
    id: "ffffffffffffffffffffffff",
    role: "teacher",
    approvalStatus: "approved",
    isActive: false,
  },
  admin: {
    id: "111111111111111111111111",
    role: "admin",
    approvalStatus: "approved",
    isActive: true,
  },
};

const originalModelMethods = {};
let server;
let baseUrl;

function lesson(id, createdBy, status = "published", extra = {}) {
  return {
    _id: id,
    title: `Lesson ${id}`,
    subject: "Physics",
    description: "Test lesson description",
    status,
    createdBy,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...extra,
    toObject() {
      const { toObject, ...data } = this;
      return { ...data };
    },
  };
}

function responseRecorder() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function invoke(handler, req) {
  const res = responseRecorder();
  await handler(req, res);
  return res;
}

async function request(path, { method = "GET", cookie, body } = {}) {
  const headers = {};
  if (cookie) headers.cookie = `${AUTH_COOKIE_NAME}=${cookie}`;
  if (body !== undefined) headers["content-type"] = "application/json";

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

function mockFind(records) {
  return (filter) => ({
    sort(sortOption) {
      const matching = records.filter((record) =>
        Object.entries(filter).every(([key, value]) => {
          if (key === "title") {
            return new RegExp(value.$regex, value.$options).test(record.title);
          }
          return String(record[key]) === String(value);
        })
      );
      if (sortOption.createdAt === 1) {
        matching.reverse();
      }
      return Promise.resolve(matching);
    },
  });
}

function mockMethod(name, implementation) {
  Lesson[name] = implementation;
}

before(async () => {
  for (const name of [
    "create",
    "find",
    "findById",
    "findOneAndUpdate",
    "findOneAndDelete",
  ]) {
    originalModelMethods[name] = Lesson[name];
  }

  const authModulePath = require.resolve("../src/middleware/authMiddleware");
  const originalAuthModule = require.cache[authModulePath];
  require.cache[authModulePath] = {
    id: authModulePath,
    filename: authModulePath,
    loaded: true,
    exports(req, res, next) {
      const token = req.cookies?.[AUTH_COOKIE_NAME];
      const user = Object.values(roles).find((candidate) => candidate.id === token);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication is required.",
        });
      }
      req.user = user;
      return next();
    },
  };

  const router = require("../src/routes/lessonRoutes");
  if (originalAuthModule) {
    require.cache[authModulePath] = originalAuthModule;
  } else {
    delete require.cache[authModulePath];
  }

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.cookies = {};
    for (const part of (req.headers.cookie || "").split(";")) {
      const [name, ...valueParts] = part.trim().split("=");
      if (name) req.cookies[name] = decodeURIComponent(valueParts.join("="));
    }
    next();
  });
  app.use("/api/lessons", router);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/lessons`;
});

afterEach(() => {
  for (const [name, method] of Object.entries(originalModelMethods)) {
    Lesson[name] = method;
  }
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

test("public and student lists contain published lessons only", async () => {
  const records = [
    lesson("1", teacherA.id, "published"),
    lesson("2", teacherA.id, "draft"),
    lesson("3", teacherB.id, "published"),
  ];
  mockMethod("find", mockFind(records));

  const publicResponse = await request("/?status=draft");
  assert.equal(publicResponse.status, 200);
  assert.ok(publicResponse.body.data.every((item) => item.status === "published"));

  const studentResponse = await request("/?status=draft", {
    cookie: roles.student.id,
  });
  assert.equal(studentResponse.status, 200);
  assert.ok(studentResponse.body.data.every((item) => item.status === "published"));
});

test("approved teachers see only their own lessons, including drafts", async () => {
  const records = [
    lesson("1", teacherA.id, "published"),
    lesson("2", teacherA.id, "draft"),
    lesson("3", teacherB.id, "draft"),
  ];
  mockMethod("find", mockFind(records));

  const response = await request("/", { cookie: teacherA.id });
  assert.equal(response.status, 200);
  assert.deepEqual(
    response.body.data.map((item) => item._id).sort(),
    ["1", "2"]
  );
  assert.ok(response.body.data.every((item) => item.createdBy === undefined));

  const ownDrafts = await request("/?status=draft", { cookie: teacherA.id });
  assert.deepEqual(ownDrafts.body.data.map((item) => item._id), ["2"]);
});

test("public and students cannot access drafts; owner teacher can", async () => {
  mockMethod("findById", async () => lesson("1", teacherA.id, "draft"));

  const publicResponse = await request("/aaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(publicResponse.status, 404);
  assert.equal(publicResponse.body.message, "Lesson not found");

  const studentResponse = await request("/aaaaaaaaaaaaaaaaaaaaaaaa", {
    cookie: roles.student.id,
  });
  assert.equal(studentResponse.status, 404);

  const ownerResponse = await request("/aaaaaaaaaaaaaaaaaaaaaaaa", {
    cookie: teacherA.id,
  });
  assert.equal(ownerResponse.status, 200);
  assert.equal(ownerResponse.body.data.createdBy, undefined);

  mockMethod("findById", async () => lesson("1", teacherB.id, "draft"));
  const otherTeacherResponse = await request("/aaaaaaaaaaaaaaaaaaaaaaaa", {
    cookie: teacherA.id,
  });
  assert.equal(otherTeacherResponse.status, 404);
});

test("teachers can update and delete only their own lessons", async () => {
  let updateFilter;
  let deleteFilter;
  mockMethod("findOneAndUpdate", async (filter, updates) => {
    updateFilter = filter;
    return filter.createdBy === teacherA.id
      ? lesson("1", teacherA.id, "published", updates)
      : null;
  });
  mockMethod("findOneAndDelete", async (filter) => {
    deleteFilter = filter;
    return filter.createdBy === teacherA.id ? lesson("1", teacherA.id) : null;
  });

  const updateBody = { title: "Updated lesson", createdBy: teacherB.id };
  const deniedUpdate = await request("/aaaaaaaaaaaaaaaaaaaaaaaa", {
    method: "PUT",
    cookie: teacherB.id,
    body: updateBody,
  });
  assert.equal(deniedUpdate.status, 404);
  assert.equal(updateFilter.createdBy, teacherB.id);

  const ownUpdate = await request("/aaaaaaaaaaaaaaaaaaaaaaaa", {
    method: "PUT",
    cookie: teacherA.id,
    body: updateBody,
  });
  assert.equal(ownUpdate.status, 200);
  assert.equal(updateFilter.createdBy, teacherA.id);
  assert.equal(ownUpdate.body.data.createdBy, undefined);

  const deniedDelete = await request("/aaaaaaaaaaaaaaaaaaaaaaaa", {
    method: "DELETE",
    cookie: teacherB.id,
  });
  assert.equal(deniedDelete.status, 404);
  assert.equal(deleteFilter.createdBy, teacherB.id);

  const ownDelete = await request("/aaaaaaaaaaaaaaaaaaaaaaaa", {
    method: "DELETE",
    cookie: teacherA.id,
  });
  assert.equal(ownDelete.status, 200);
  assert.equal(deleteFilter.createdBy, teacherA.id);
});

test("create assigns owner from authenticated user, ignoring client createdBy", async () => {
  let created;
  mockMethod("create", async (data) => {
    created = data;
    return lesson("1", data.createdBy, data.status, data);
  });

  const response = await request("/", {
    method: "POST",
    cookie: teacherA.id,
    body: {
      title: "New lesson",
      subject: "Physics",
      description: "A valid description",
      status: "draft",
      createdBy: teacherB.id,
    },
  });
  assert.equal(response.status, 201);
  assert.equal(created.createdBy, teacherA.id);
  assert.equal(response.body.data.createdBy, undefined);
});

test("unauthenticated writes return 401", async () => {
  for (const [method, path] of [
    ["POST", "/"],
    ["PUT", "/aaaaaaaaaaaaaaaaaaaaaaaa"],
    ["DELETE", "/aaaaaaaaaaaaaaaaaaaaaaaa"],
  ]) {
    const response = await request(path, { method });
    assert.equal(response.status, 401, `${method} ${path}`);
  }
});

test("non-approved teacher roles cannot use teacher-only writes", async () => {
  for (const user of [
    roles.student,
    roles.pending,
    roles.rejected,
    roles.inactive,
    roles.admin,
  ]) {
    for (const [method, path] of [
      ["POST", "/"],
      ["PUT", "/aaaaaaaaaaaaaaaaaaaaaaaa"],
      ["DELETE", "/aaaaaaaaaaaaaaaaaaaaaaaa"],
    ]) {
      const response = await request(path, {
        method,
        cookie: user.id,
        body: method === "DELETE" ? undefined : { title: "A title" },
      });
      assert.equal(response.status, 403, `${user.role}/${user.approvalStatus} ${method}`);
    }
  }
});

test("invalid lesson IDs and validation errors retain API responses", async () => {
  const invalidId = await request("/not-an-object-id");
  assert.equal(invalidId.status, 400);
  assert.deepEqual(invalidId.body, {
    success: false,
    message: "Invalid lesson ID",
  });

  for (const method of ["PUT", "DELETE"]) {
    const invalidWriteId = await request("/not-an-object-id", {
      method,
      cookie: teacherA.id,
      body: method === "PUT" ? { title: "Valid title" } : undefined,
    });
    assert.equal(invalidWriteId.status, 400, `${method} invalid ID`);
    assert.deepEqual(invalidWriteId.body, {
      success: false,
      message: "Invalid lesson ID",
    });
  }

  const validationError = new Error("Invalid title");
  validationError.name = "ValidationError";
  validationError.errors = {
    title: { message: "Title must contain at least 3 characters" },
  };
  mockMethod("findOneAndUpdate", async () => {
    throw validationError;
  });

  const updateResponse = await request("/aaaaaaaaaaaaaaaaaaaaaaaa", {
    method: "PUT",
    cookie: teacherA.id,
    body: { title: "x" },
  });
  assert.equal(updateResponse.status, 400);
  assert.deepEqual(updateResponse.body, {
    success: false,
    message: "Validation failed",
    errors: ["Title must contain at least 3 characters"],
  });

  mockMethod("create", async () => {
    throw validationError;
  });
  const createResponse = await request("/", {
    method: "POST",
    cookie: teacherA.id,
    body: {
      title: "x",
      subject: "Physics",
      description: "A valid description",
    },
  });
  assert.equal(createResponse.status, 400);
  assert.deepEqual(createResponse.body, {
    success: false,
    message: "Validation failed",
    errors: ["Title must contain at least 3 characters"],
  });
});
