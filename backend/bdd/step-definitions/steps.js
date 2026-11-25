const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("node:assert/strict");

const API = process.env.AL_LMS_API_URL || "http://localhost:5000";

Given("the AL-LMS API is running", async function () {
  const response = await fetch(`${API}/api/health`);
  assert.equal(response.status, 200, "AL-LMS health endpoint must be available");
});

Given("I have a pending teacher authentication cookie", function () {
  this.pendingTeacherCookie = process.env.AL_LMS_PENDING_TEACHER_COOKIE;
  assert.ok(this.pendingTeacherCookie, "Set AL_LMS_PENDING_TEACHER_COOKIE to a test-only pending teacher JWT cookie value");
});

When("I submit an enrollment request without an authentication cookie", async function () {
  const courseId = process.env.AL_LMS_TEST_COURSE_ID || "aaaaaaaaaaaaaaaaaaaaaaaa";
  const response = await fetch(`${API}/api/enrollments/courses/${courseId}`, { method: "POST" });
  this.responseStatus = response.status;
});

When("I submit a valid course creation request", async function () {
  const response = await fetch(`${API}/api/courses`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `nisova_auth=${this.pendingTeacherCookie}` },
    body: JSON.stringify({ title: "BDD Test Course", description: "Course created by BDD test", subject: "Physics", medium: "English", academicYear: 2026, status: "draft" }),
  });
  this.responseStatus = response.status;
});

Then("the API response status should be {int}", function (expectedStatus) {
  assert.equal(this.responseStatus, expectedStatus);
});
