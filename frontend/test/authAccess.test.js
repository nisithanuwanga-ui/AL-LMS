import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getProtectedRouteDecision,
  getRoleHome,
} from "../src/auth/access.js";
import { getAuthStateAfterResponse } from "../src/auth/session.js";

const student = { id: "student", role: "student", approvalStatus: "approved" };
const approvedTeacher = {
  id: "teacher",
  role: "teacher",
  approvalStatus: "approved",
};
const pendingTeacher = {
  id: "pending",
  role: "teacher",
  approvalStatus: "pending",
};
const inactiveTeacher = {
  id: "inactive",
  role: "teacher",
  approvalStatus: "approved",
  isActive: false,
};
const admin = { id: "admin", role: "admin", approvalStatus: "approved" };

test("role destinations are derived from the authenticated user", () => {
  assert.equal(getRoleHome(student), "/student/dashboard");
  assert.equal(getRoleHome(approvedTeacher), "/teacher/dashboard");
  assert.equal(getRoleHome(pendingTeacher), "/teacher/pending");
  assert.equal(getRoleHome(admin), "/admin");
});

test("protected routes wait for restoration and redirect unauthenticated users", () => {
  assert.deepEqual(
    getProtectedRouteDecision("loading", null, ["admin"]),
    { type: "loading" },
  );
  assert.deepEqual(
    getProtectedRouteDecision("unauthenticated", null, ["admin"]),
    { type: "redirect", to: "/login" },
  );
  assert.deepEqual(
    getProtectedRouteDecision("authenticated", student, ["admin"]),
    { type: "redirect", to: "/student/dashboard" },
  );
});

test("student and admin routes only render for their matching roles", () => {
  assert.deepEqual(
    getProtectedRouteDecision("authenticated", student, ["student"]),
    { type: "render" },
  );
  assert.deepEqual(
    getProtectedRouteDecision("authenticated", admin, ["admin"]),
    { type: "render" },
  );
  assert.deepEqual(
    getProtectedRouteDecision("unauthenticated", null, ["student"], {
      allowPublic: true,
    }),
    { type: "render" },
  );
});

test("only approved active teachers enter lesson management", () => {
  assert.deepEqual(
    getProtectedRouteDecision("authenticated", approvedTeacher, ["teacher"]),
    { type: "render" },
  );
  assert.deepEqual(
    getProtectedRouteDecision("authenticated", pendingTeacher, ["teacher"]),
    { type: "redirect", to: "/teacher/pending" },
  );
  assert.deepEqual(
    getProtectedRouteDecision(
      "authenticated",
      pendingTeacher,
      ["teacher"],
      { allowPendingTeacher: true },
    ),
    { type: "render" },
  );
  assert.deepEqual(
    getProtectedRouteDecision("authenticated", inactiveTeacher, ["teacher"]),
    { type: "redirect", to: "/" },
  );
});

test("401 clears the authenticated session", () => {
  const currentState = {
    user: student,
    status: "authenticated",
    authError: "",
  };
  assert.deepEqual(getAuthStateAfterResponse(currentState, 401), {
    user: null,
    status: "unauthenticated",
    authError: "",
  });
});

test("403 preserves an authenticated student's session after an admin request", () => {
  const currentState = {
    user: student,
    status: "authenticated",
    authError: "",
  };
  const nextState = getAuthStateAfterResponse(currentState, 403);
  assert.equal(nextState, currentState);
  assert.equal(nextState.user, student);
  assert.equal(nextState.status, "authenticated");
});
