import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { API_BASE_URL, ApiError, apiRequest } from "../src/services/api.js";

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

test("API client uses its configured base and includes cookie credentials", async () => {
  let requestUrl;
  let requestOptions;
  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return new Response('{"success":true}', {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await apiRequest("/auth/me");
  assert.equal(requestUrl, `${API_BASE_URL}/auth/me`);
  assert.equal(requestOptions.credentials, "include");
  assert.equal(result.data.success, true);
});

test("API client preserves server error messages and status", async () => {
  globalThis.fetch = async () =>
    new Response('{"success":false,"message":"Application not found."}', {
      status: 404,
      headers: { "content-type": "application/json" },
    });

  await assert.rejects(apiRequest("/admin/teachers/unknown/approval"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 404);
    assert.equal(error.message, "Application not found.");
    return true;
  });
});

test("API client reports 401 and 403 responses without conflating statuses", async () => {
  const authResponses = [];
  globalThis.window = new EventTarget();
  globalThis.window.addEventListener("nisova:auth-response", (event) => {
    authResponses.push(event.statusCode);
  });

  globalThis.fetch = async (_url, options) =>
    new Response(
      JSON.stringify({
        success: false,
        message: options.headers.get("x-test-status") === "401"
          ? "Authentication is required."
          : "You do not have permission.",
      }),
      {
        status: Number(options.headers.get("x-test-status")),
        headers: { "content-type": "application/json" },
      },
    );

  await assert.rejects(
    apiRequest("/auth/me", { headers: { "x-test-status": "401" } }),
    (error) => error.status === 401,
  );
  await assert.rejects(
    apiRequest("/admin/teachers/pending", {
      headers: { "x-test-status": "403" },
    }),
    (error) => error.status === 403 && error.message === "You do not have permission.",
  );

  assert.deepEqual(authResponses, [401, 403]);
});
