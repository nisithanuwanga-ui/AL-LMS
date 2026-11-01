import assert from "node:assert/strict";
import { test } from "node:test";
import { getSafeExternalUrl } from "../src/services/safeUrl.js";

test("course lesson links allow web URLs and reject unsafe protocols", () => {
  assert.equal(getSafeExternalUrl("https://example.com/lesson"), "https://example.com/lesson");
  assert.equal(getSafeExternalUrl("javascript:alert(1)"), null);
  assert.equal(getSafeExternalUrl("not a URL"), null);
  assert.equal(getSafeExternalUrl(""), null);
});
