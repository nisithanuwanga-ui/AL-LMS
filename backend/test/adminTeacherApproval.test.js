const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { after, afterEach, before, test } = require("node:test");

const User = require("../src/models/User");
const { AUTH_COOKIE_NAME } = require("../src/utils/authConfig");

const users = {
  admin: {
    id: "111111111111111111111111",
    role: "admin",
    approvalStatus: "approved",
    isActive: true,
  },
  student: {
    id: "222222222222222222222222",
    role: "student",
    approvalStatus: "approved",
    isActive: true,
  },
  teacher: {
    id: "333333333333333333333333",
    role: "teacher",
    approvalStatus: "approved",
    isActive: true,
  },
};

const originalFind = User.find;
const originalFindOneAndUpdate = User.findOneAndUpdate;
let server;
let baseUrl;
let queryFilter;
let updateFilter;
let updateDocument;

function application(id, role, approvalStatus, createdAt, extra = {}) {
  return {
    _id: id,
    name: `Applicant ${id}`,
    email: `${id}@example.com`,
    role,
    approvalStatus,
    isActive: true,
    password: "must-not-be-returned",
    passwordHash: "must-not-be-returned",
    createdAt,
    ...extra,
  };
}

function request(path, { method = "GET", cookie, body, rawBody } = {}) {
  const headers = {};
  if (cookie) headers.cookie = `${AUTH_COOKIE_NAME}=${cookie}`;
  if (body !== undefined || rawBody !== undefined) {
    headers["content-type"] = "application/json";
  }

  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  }).then(async (response) => ({
    status: response.status,
    body: await response.json(),
  }));
}

function mockAuthentication(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  const user = Object.values(users).find((candidate) => candidate.id === token);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required.",
    });
  }
  req.user = user;
  return next();
}

before(async () => {
  const authModulePath = require.resolve("../src/middleware/authMiddleware");
  const originalAuthModule = require.cache[authModulePath];
  require.cache[authModulePath] = {
    id: authModulePath,
    filename: authModulePath,
    loaded: true,
    exports: mockAuthentication,
  };

  const router = require("../src/routes/adminRoutes");

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
  app.use("/api/admin", router);
  app.use("/api/admin", (error, _req, res, _next) => {
    if (error.type === "entity.parse.failed") {
      return res.status(400).json({
        success: false,
        message: "Request body must be valid JSON.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  });

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/admin`;
});

afterEach(() => {
  User.find = originalFind;
  User.findOneAndUpdate = originalFindOneAndUpdate;
  queryFilter = undefined;
  updateFilter = undefined;
  updateDocument = undefined;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

test("admin gets pending teachers only, oldest first, with safe fields", async () => {
  const pendingNew = application(
    "444444444444444444444444",
    "teacher",
    "pending",
    new Date("2026-02-01T00:00:00.000Z")
  );
  const pendingOld = application(
    "555555555555555555555555",
    "teacher",
    "pending",
    new Date("2026-01-01T00:00:00.000Z")
  );
  const records = [
    pendingNew,
    application("666666666666666666666666", "student", "pending", new Date()),
    application("777777777777777777777777", "admin", "pending", new Date()),
    application("888888888888888888888888", "teacher", "approved", new Date()),
    application("999999999999999999999999", "teacher", "rejected", new Date()),
    pendingOld,
  ];

  User.find = (filter) => {
    queryFilter = filter;
    return {
      select(selection) {
        assert.equal(selection, "name email role approvalStatus");
        return this;
      },
      sort(sortOrder) {
        assert.deepEqual(sortOrder, { createdAt: 1 });
        const matching = records
          .filter(
            (user) =>
              user.role === filter.role &&
              user.approvalStatus === filter.approvalStatus
          )
          .sort((a, b) => a.createdAt - b.createdAt);
        return Promise.resolve(matching);
      },
    };
  };

  const response = await request("/teachers/pending", {
    cookie: users.admin.id,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(queryFilter, { role: "teacher", approvalStatus: "pending" });
  assert.equal(response.body.count, 2);
  assert.deepEqual(
    response.body.data.map((user) => user.id),
    [pendingOld._id, pendingNew._id]
  );
  assert.ok(
    response.body.data.every(
      (user) =>
        user.role === "teacher" &&
        user.approvalStatus === "pending" &&
        !("password" in user) &&
        !("passwordHash" in user) &&
        !("isActive" in user) &&
        !("createdAt" in user)
    )
  );
});

test("admin approves and rejects only pending teacher applications atomically", async () => {
  User.findOneAndUpdate = (filter, update, options) => {
    updateFilter = filter;
    updateDocument = update;
    assert.deepEqual(options, { new: true, runValidators: true });
    return {
      select(selection) {
        assert.equal(selection, "name email role approvalStatus");
        const result = {
          ...application(
            filter._id,
            "teacher",
            update.$set.approvalStatus,
            new Date()
          ),
        };
        return Promise.resolve(result);
      },
    };
  };

  for (const [action, expectedStatus] of [
    ["approve", "approved"],
    ["reject", "rejected"],
  ]) {
    const id =
      action === "approve"
        ? "aaaaaaaaaaaaaaaaaaaaaaaa"
        : "bbbbbbbbbbbbbbbbbbbbbbbb";
    const response = await request(`/teachers/${id}/approval`, {
      method: "PATCH",
      cookie: users.admin.id,
      body: { action },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(updateFilter, {
      _id: id,
      role: "teacher",
      approvalStatus: "pending",
    });
    assert.deepEqual(updateDocument, {
      $set: { approvalStatus: expectedStatus },
    });
    assert.equal(response.body.user.approvalStatus, expectedStatus);
    assert.equal(response.body.user.password, undefined);
  }
});

test("missing and already-processed teacher applications return 404", async () => {
  User.findOneAndUpdate = () => ({
    select() {
      return Promise.resolve(null);
    },
  });

  const response = await request(
    "/teachers/aaaaaaaaaaaaaaaaaaaaaaaa/approval",
    {
      method: "PATCH",
      cookie: users.admin.id,
      body: { action: "approve" },
    }
  );
  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});

test("students and teachers cannot access admin endpoints", async () => {
  for (const user of [users.student, users.teacher]) {
    const listResponse = await request("/teachers/pending", {
      cookie: user.id,
    });
    assert.equal(listResponse.status, 403);

    const updateResponse = await request(
      "/teachers/aaaaaaaaaaaaaaaaaaaaaaaa/approval",
      {
        method: "PATCH",
        cookie: user.id,
        body: { action: "approve" },
      }
    );
    assert.equal(updateResponse.status, 403);
  }
});

test("unauthenticated requests receive 401", async () => {
  const listResponse = await request("/teachers/pending");
  assert.equal(listResponse.status, 401);

  const updateResponse = await request(
    "/teachers/aaaaaaaaaaaaaaaaaaaaaaaa/approval",
    {
      method: "PATCH",
      body: { action: "approve" },
    }
  );
  assert.equal(updateResponse.status, 401);
});

test("invalid IDs and actions return 400 without database updates", async () => {
  let updateCalled = false;
  User.findOneAndUpdate = () => {
    updateCalled = true;
    throw new Error("Should not be called");
  };

  const invalidIdResponse = await request("/teachers/not-an-object-id/approval", {
    method: "PATCH",
    cookie: users.admin.id,
    body: { action: "approve" },
  });
  assert.equal(invalidIdResponse.status, 400);

  const invalidActionResponse = await request(
    "/teachers/aaaaaaaaaaaaaaaaaaaaaaaa/approval",
    {
      method: "PATCH",
      cookie: users.admin.id,
      body: { action: "delete", role: "admin", approvalStatus: "approved" },
    }
  );
  assert.equal(invalidActionResponse.status, 400);
  assert.equal(updateCalled, false);
});

test("student and admin target accounts cannot be approved or rejected", async () => {
  const targets = [
    {
      _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      role: "student",
      approvalStatus: "pending",
    },
    {
      _id: "bbbbbbbbbbbbbbbbbbbbbbbb",
      role: "admin",
      approvalStatus: "pending",
    },
    {
      _id: "cccccccccccccccccccccccc",
      role: "teacher",
      approvalStatus: "approved",
    },
    {
      _id: "dddddddddddddddddddddddd",
      role: "teacher",
      approvalStatus: "rejected",
    },
  ];

  User.findOneAndUpdate = (filter) => ({
    select() {
      const target = targets.find(
        (candidate) =>
          candidate._id === filter._id &&
          candidate.role === filter.role &&
          candidate.approvalStatus === filter.approvalStatus
      );
      return Promise.resolve(target ? application(target._id, "teacher", "approved", new Date()) : null);
    },
  });

  for (const id of targets.map((target) => target._id)) {
    const response = await request(`/teachers/${id}/approval`, {
      method: "PATCH",
      cookie: users.admin.id,
      body: { action: "approve" },
    });
    assert.equal(response.status, 404);
  }
});

test("malformed admin JSON receives the standard JSON parse error", async () => {
  const response = await request(
    "/teachers/aaaaaaaaaaaaaaaaaaaaaaaa/approval",
    {
      method: "PATCH",
      cookie: users.admin.id,
      rawBody: "{invalid",
    }
  );
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: "Request body must be valid JSON.",
  });
});
