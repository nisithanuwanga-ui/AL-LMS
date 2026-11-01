import assert from "node:assert/strict";
import { test } from "node:test";
import { createCourseSearchParams } from "../src/services/courseFilters.js";

test("course filters encode supported browsing criteria and trim search", () => {
  const params = createCourseSearchParams({
    search: "  mechanics  ",
    subject: "Physics",
    medium: "Sinhala",
    academicYear: 2026,
  });

  assert.equal(params.toString(), "search=mechanics&subject=Physics&medium=Sinhala&academicYear=2026");
});

test("empty course filters do not add query parameters", () => {
  assert.equal(createCourseSearchParams({ search: " ", subject: "", medium: "" }).size, 0);
});
