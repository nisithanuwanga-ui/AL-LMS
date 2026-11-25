import assert from "node:assert/strict";
import { test } from "node:test";
import { getRoleHome } from "../src/auth/access.js";

test("unknown or missing user roles fall back to the public home route", () => {
  assert.equal(getRoleHome(null), "/");
  assert.equal(getRoleHome({ role: "unknown" }), "/");
});
