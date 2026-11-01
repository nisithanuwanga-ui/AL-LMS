import assert from "node:assert/strict";
import { test } from "node:test";
import { getCourseLessonsPath } from "../src/services/courseLessons.js";

test("course detail requests lessons scoped to the encoded course identifier", () => {
  assert.equal(
    getCourseLessonsPath("course/id"),
    "/lessons?courseId=course%2Fid",
  );
});
