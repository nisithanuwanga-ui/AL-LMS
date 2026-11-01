const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { after, afterEach, before, test } = require("node:test");

const Course = require("../src/models/Course");
const Enrollment = require("../src/models/Enrollment");
const Lesson = require("../src/models/Lesson");
const User = require("../src/models/User");
const { AUTH_COOKIE_NAME } = require("../src/utils/authConfig");

const ids = {
  admin: "111111111111111111111111",
  student: "222222222222222222222222",
  otherStudent: "333333333333333333333333",
  teacher: "444444444444444444444444",
  otherTeacher: "555555555555555555555555",
  pending: "666666666666666666666666",
  course: "aaaaaaaaaaaaaaaaaaaaaaaa",
  otherCourse: "bbbbbbbbbbbbbbbbbbbbbbbb",
  enrollment: "cccccccccccccccccccccccc",
};
const users = Object.fromEntries(
  Object.entries(ids).slice(0, 6).map(([role, id]) => [
    id,
    {
      id,
      role: role.includes("Teacher") || role === "teacher" || role === "pending"
        ? "teacher"
        : role,
      approvalStatus: role === "pending" ? "pending" : "approved",
      isActive: true,
    },
  ]),
);

class MockQuery {
  constructor(resolve) {
    this.resolve = resolve;
  }
  sort() { return this; }
  populate() { return this; }
  then(resolve, reject) { return Promise.resolve().then(this.resolve).then(resolve, reject); }
}

const originals = {
  Course: {},
  Enrollment: {},
  Lesson: {},
  User: {},
};
let courses;
let enrollments;
let lessons;
let server;
let baseUrl;

function matches(record, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === "title" && value?.$regex) {
      return new RegExp(value.$regex, value.$options).test(record.title);
    }
    return String(record[key]) === String(value);
  });
}

function makeCourse(id, teacherId, status = "published", extra = {}) {
  return {
    _id: id,
    title: `Course ${id}`,
    description: "Course description",
    subject: "Physics",
    medium: "English",
    academicYear: 2026,
    teacherId,
    status,
    ...extra,
  };
}

function makeEnrollment(studentId, courseId, status = "enrolled") {
  return {
    _id: ids.enrollment,
    studentId,
    courseId,
    status,
    enrolledAt: new Date("2026-01-01T00:00:00.000Z"),
  };
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
  return { status: response.status, body: await response.json() };
}

before(async () => {
  for (const [model, methods] of Object.entries({
    Course: ["find", "findById", "findOne", "create", "findOneAndUpdate", "deleteOne", "countDocuments"],
    Enrollment: ["find", "findById", "findOne", "create", "findOneAndUpdate", "countDocuments"],
    Lesson: ["countDocuments"],
    User: ["findOne"],
  })) {
    const Model = { Course, Enrollment, Lesson, User }[model];
    for (const method of methods) originals[model][method] = Model[method];
  }

  const authPath = require.resolve("../src/middleware/authMiddleware");
  const originalAuth = require.cache[authPath];
  require.cache[authPath] = {
    id: authPath,
    filename: authPath,
    loaded: true,
    exports(req, res, next) {
      const user = users[req.cookies?.[AUTH_COOKIE_NAME]];
      if (!user) return res.status(401).json({ success: false, message: "Authentication is required." });
      req.user = user;
      return next();
    },
  };
  const courseRouter = require("../src/routes/courseRoutes");
  const enrollmentRouter = require("../src/routes/enrollmentRoutes");
  if (originalAuth) require.cache[authPath] = originalAuth;
  else delete require.cache[authPath];

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.cookies = {};
    for (const part of (req.headers.cookie || "").split(";")) {
      const [name, ...parts] = part.trim().split("=");
      if (name) req.cookies[name] = decodeURIComponent(parts.join("="));
    }
    next();
  });
  app.use("/api/courses", courseRouter);
  app.use("/api/enrollments", enrollmentRouter);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

afterEach(() => {
  for (const [model, methods] of Object.entries(originals)) {
    const Model = { Course, Enrollment, Lesson, User }[model];
    for (const [name, method] of Object.entries(methods)) Model[name] = method;
  }
  courses = [
    makeCourse(ids.course, ids.teacher),
    makeCourse(ids.otherCourse, ids.otherTeacher, "draft"),
  ];
  enrollments = [];
  lessons = [];
});

before(() => {
  courses = [
    makeCourse(ids.course, ids.teacher),
    makeCourse(ids.otherCourse, ids.otherTeacher, "draft"),
  ];
  enrollments = [];
  lessons = [];
});

after(async () => {
  if (server) await new Promise((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()));
});

function installCourseMocks() {
  Course.find = (filter) => new MockQuery(() => courses.filter((course) => matches(course, filter)));
  Course.findById = async (id) => courses.find((course) => String(course._id) === String(id)) || null;
  Course.findOne = async (filter) => courses.find((course) => matches(course, filter)) || null;
  Course.create = async (record) => {
    const created = makeCourse(ids.course, record.teacherId, record.status || "draft", record);
    courses.push(created);
    return created;
  };
  Course.findOneAndUpdate = async (filter, update) => {
    const record = courses.find((course) => matches(course, filter));
    if (!record) return null;
    Object.assign(record, update);
    return record;
  };
  Course.deleteOne = async ({ _id }) => {
    courses = courses.filter((course) => String(course._id) !== String(_id));
    return { deletedCount: 1 };
  };
  Course.countDocuments = async () => lessons.length;
  Lesson.countDocuments = async ({ courseId }) => lessons.filter((lesson) => String(lesson.courseId) === String(courseId)).length;
  Enrollment.countDocuments = async ({ courseId }) => enrollments.filter((item) => String(item.courseId) === String(courseId)).length;
  User.findOne = async (filter) => users[filter._id] || (filter._id === ids.teacher
    ? { id: ids.teacher } : filter._id === ids.otherTeacher ? { id: ids.otherTeacher } : null);
}

function installEnrollmentMocks() {
  Enrollment.find = (filter) => new MockQuery(() => enrollments.filter((item) => matches(item, filter)));
  Enrollment.findById = (id) => new MockQuery(() => enrollments.find((item) => String(item._id) === String(id)) || null);
  Enrollment.findOne = async (filter) => enrollments.find((item) => matches(item, filter)) || null;
  Enrollment.create = async (record) => {
    if (enrollments.some((item) => String(item.studentId) === String(record.studentId) && String(item.courseId) === String(record.courseId))) {
      const error = new Error("duplicate key");
      error.code = 11000;
      throw error;
    }
    const created = { _id: ids.enrollment, ...record, enrolledAt: new Date() };
    enrollments.push(created);
    return created;
  };
  Enrollment.findOneAndUpdate = (filter, update) => new MockQuery(() => {
    const item = enrollments.find((record) => matches(record, filter));
    if (!item) return null;
    Object.assign(item, update);
    return item;
  });
  Course.findOne = async (filter) => courses.find((course) => matches(course, filter)) || null;
  Course.findById = async (id) => courses.find((course) => String(course._id) === String(id)) || null;
}

test("public course reads expose published courses only and support filters", async () => {
  installCourseMocks();
  const response = await request("/courses?status=draft");
  assert.equal(response.status, 200);
  assert.ok(response.body.data.every((course) => course.status === "published"));

  const teacherResponse = await request("/courses", { cookie: ids.teacher });
  assert.deepEqual(teacherResponse.body.data.map((course) => course._id), [ids.course]);
  const invalid = await request("/courses?subject=Unlisted");
  assert.equal(invalid.status, 400);
});

test("course detail hides drafts from public users and validates Mongo IDs", async () => {
  installCourseMocks();
  const hidden = await request(`/courses/${ids.otherCourse}`);
  assert.equal(hidden.status, 404);
  const invalid = await request("/courses/not-an-object-id");
  assert.equal(invalid.status, 400);
});

test("course writes are denied to students and unapproved teachers", async () => {
  installCourseMocks();
  for (const cookie of [ids.student, ids.pending]) {
    const response = await request("/courses", {
      method: "POST",
      cookie,
      body: { title: "Blocked course" },
    });
    assert.equal(response.status, 403);
  }
});

test("approved teachers create and update only their courses without ownership spoofing", async () => {
  installCourseMocks();
  let created;
  Course.create = async (record) => {
    created = record;
    const saved = makeCourse("dddddddddddddddddddddddd", record.teacherId, record.status, record);
    courses.push(saved);
    return saved;
  };
  const creation = await request("/courses", {
    method: "POST",
    cookie: ids.teacher,
    body: {
      title: "Physics course",
      description: "A course description",
      subject: "Physics",
      medium: "English",
      academicYear: 2026,
      status: "draft",
      teacherId: ids.otherTeacher,
    },
  });
  assert.equal(creation.status, 201);
  assert.equal(String(created.teacherId), ids.teacher);

  const denied = await request(`/courses/${ids.course}`, {
    method: "PUT",
    cookie: ids.otherTeacher,
    body: { title: "Attempted takeover", teacherId: ids.otherTeacher },
  });
  assert.equal(denied.status, 404);
  const updated = await request(`/courses/${ids.course}`, {
    method: "PUT",
    cookie: ids.teacher,
    body: { status: "draft", teacherId: ids.otherTeacher },
  });
  assert.equal(updated.status, 200);
  assert.equal(String(updated.body.data.teacherId), ids.teacher);
});

test("admins manage courses and course deletion preserves referenced data", async () => {
  installCourseMocks();
  const update = await request(`/courses/${ids.otherCourse}`, {
    method: "PUT",
    cookie: ids.admin,
    body: { status: "published", teacherId: ids.teacher },
  });
  assert.equal(update.status, 200);
  assert.equal(String(update.body.data.teacherId), ids.otherTeacher);

  lessons.push({ courseId: ids.otherCourse });
  const protectedDelete = await request(`/courses/${ids.otherCourse}`, {
    method: "DELETE",
    cookie: ids.admin,
  });
  assert.equal(protectedDelete.status, 409);

  lessons = [];
  const deletion = await request(`/courses/${ids.otherCourse}`, {
    method: "DELETE",
    cookie: ids.admin,
  });
  assert.equal(deletion.status, 200);
});

test("students enroll in published courses with server-derived identity and cannot duplicate", async () => {
  installEnrollmentMocks();
  const created = await request(`/enrollments/courses/${ids.course}`, {
    method: "POST",
    cookie: ids.student,
    body: { studentId: ids.otherStudent },
  });
  assert.equal(created.status, 201);
  assert.equal(String(enrollments[0].studentId), ids.student);

  const duplicate = await request(`/enrollments/courses/${ids.course}`, {
    method: "POST",
    cookie: ids.student,
  });
  assert.equal(duplicate.status, 409);

  const draft = await request(`/enrollments/courses/${ids.otherCourse}`, {
    method: "POST",
    cookie: ids.student,
  });
  assert.equal(draft.status, 404);

  const invalidCourse = await request("/enrollments/courses/not-an-object-id", {
    method: "POST",
    cookie: ids.student,
  });
  assert.equal(invalidCourse.status, 400);
});

test("cancelled enrollments can be restored without creating a duplicate pair", async () => {
  installEnrollmentMocks();
  enrollments = [makeEnrollment(ids.student, ids.course, "cancelled")];
  const response = await request(`/enrollments/courses/${ids.course}`, {
    method: "POST",
    cookie: ids.student,
  });
  assert.equal(response.status, 200);
  assert.equal(enrollments.length, 1);
  assert.equal(enrollments[0].status, "enrolled");
});

test("course schema validates required fields and enrollment has a unique student-course index", async () => {
  const CourseModel = require("../src/models/Course");
  const EnrollmentModel = require("../src/models/Enrollment");
  const invalid = new CourseModel({
    title: "x",
    subject: "History",
    medium: "French",
    academicYear: 1999,
    teacherId: ids.teacher,
  });
  await assert.rejects(invalid.validate(), (error) => {
    assert.ok(error.errors.title);
    assert.ok(error.errors.subject);
    assert.ok(error.errors.medium);
    assert.ok(error.errors.academicYear);
    assert.ok(error.errors.description);
    return true;
  });

  assert.ok(EnrollmentModel.schema.indexes().some(([fields, options]) =>
    fields.studentId === 1 && fields.courseId === 1 && options.unique === true));
});

test("students can only list and cancel their own enrollments", async () => {
  installEnrollmentMocks();
  enrollments = [
    makeEnrollment(ids.student, ids.course),
    { ...makeEnrollment(ids.otherStudent, ids.otherCourse), _id: ids.otherCourse },
  ];
  const mine = await request("/enrollments/mine", { cookie: ids.student });
  assert.equal(mine.body.count, 1);
  assert.equal(String(mine.body.data[0].studentId), ids.student);

  const other = await request(`/enrollments/${ids.otherCourse}/cancel`, {
    method: "PATCH",
    cookie: ids.student,
  });
  assert.equal(other.status, 404);
  const cancelled = await request(`/enrollments/${ids.enrollment}/cancel`, {
    method: "PATCH",
    cookie: ids.student,
  });
  assert.equal(cancelled.status, 200);
  assert.equal(enrollments[0].status, "cancelled");
});

test("teachers see enrollments only for courses they own; admin can list all", async () => {
  installEnrollmentMocks();
  enrollments = [makeEnrollment(ids.student, ids.course)];
  const allowed = await request(`/enrollments/course/${ids.course}`, { cookie: ids.teacher });
  assert.equal(allowed.status, 200);
  const denied = await request(`/enrollments/course/${ids.otherCourse}`, { cookie: ids.teacher });
  assert.equal(denied.status, 404);
  const admin = await request("/enrollments", { cookie: ids.admin });
  assert.equal(admin.status, 200);
});
