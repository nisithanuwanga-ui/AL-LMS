const assert = require("node:assert/strict");
const cors = require("cors");
const express = require("express");
const http = require("node:http");
const { test } = require("node:test");
const { getCorsOptions } = require("../src/config/corsConfig");

test("local CORS defaults to the Vite origin on port 5173 with credentials", () => {
  assert.deepEqual(getCorsOptions(undefined), {
    origin: "http://localhost:5173",
    credentials: true,
  });
});

test("CLIENT_URL overrides the local default with one specific origin", () => {
  assert.deepEqual(getCorsOptions("https://learn.example.com"), {
    origin: "https://learn.example.com",
    credentials: true,
  });
});

test("credentialed CORS rejects wildcard configuration", () => {
  assert.throws(
    () => getCorsOptions("*"),
    /CLIENT_URL must be a specific origin/,
  );
});

test("CORS responds with the configured origin and credentials header", async (t) => {
  const app = express();
  app.use(cors(getCorsOptions(undefined)));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health`, {
    headers: { Origin: "http://localhost:5173" },
  });

  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
});
