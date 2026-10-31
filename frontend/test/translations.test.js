import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { test } from "node:test";
import { translations } from "../src/i18n/translations.js";

const sourceRoot = fileURLToPath(new URL("../src", import.meta.url));

async function getSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return getSourceFiles(entryPath);
      return /\.(js|jsx)$/.test(entry.name) ? [entryPath] : [];
    }),
  );
  return nested.flat();
}

test("all statically referenced translation keys exist in all supported languages", async () => {
  const files = await getSourceFiles(sourceRoot);
  const sourceText = (
    await Promise.all(files.map((file) => readFile(file, "utf8")))
  ).join("\n");
  const referencedKeys = new Set(
    [...sourceText.matchAll(/\bt\(["']([^"'{}]+)["']/g)].map((match) => match[1]),
  );

  for (const language of ["en", "si", "ta"]) {
    for (const key of referencedKeys) {
      assert.ok(
        Object.hasOwn(translations[language], key),
        `Missing ${language} translation for ${key}`,
      );
    }
  }
});
