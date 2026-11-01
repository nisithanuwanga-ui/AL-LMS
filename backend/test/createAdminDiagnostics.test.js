const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  classifyProvisioningError,
  formatProvisioningError,
  getMongoUri,
  loadEnvironment,
  sanitizeDiagnostic,
} = require("../scripts/createAdmin");
const path = require("node:path");

test("admin provisioning diagnostics distinguish database failure categories", () => {
  assert.equal(
    classifyProvisioningError({ name: "MongooseServerSelectionError", message: "no server" }),
    "MongoDB connection",
  );
  assert.equal(
    classifyProvisioningError({ name: "MongoServerError", code: 18, message: "Authentication failed" }),
    "MongoDB authentication/permission",
  );
  assert.equal(
    classifyProvisioningError({ name: "MongoServerError", code: 13, message: "not authorized" }),
    "MongoDB authentication/permission",
  );
  assert.equal(
    classifyProvisioningError({ name: "MongoServerError", code: 11000, message: "duplicate" }),
    "Duplicate admin email",
  );
  assert.equal(
    classifyProvisioningError({ name: "ValidationError", message: "invalid field" }),
    "Validation",
  );
  assert.equal(
    classifyProvisioningError({ name: "TypeError", message: "unexpected" }),
    "Unexpected",
  );
});

test("admin provisioning diagnostics show safe details and redact secrets", () => {
  const uri = "mongodb+srv://admin:db-secret@example.test/db";
  const password = "admin-password-secret";
  const formatted = formatProvisioningError(
    {
      name: "MongoServerError",
      code: 18,
      message: `Authentication failed for ${uri}; password=${password}`,
    },
    [uri, password],
  );

  assert.match(formatted, /^\[MongoDB authentication\/permission\] MongoServerError:/);
  assert.match(formatted, /Authentication failed/);
  assert.doesNotMatch(formatted, /db-secret|admin-password-secret/);
  assert.match(sanitizeDiagnostic(`uri=${uri}`, [uri]), /REDACTED/);
});

test("admin provisioning loads dotenv from the backend directory, independent of cwd", () => {
  let receivedOptions;
  loadEnvironment((options) => {
    receivedOptions = options;
    return { parsed: {} };
  });

  assert.deepEqual(receivedOptions, {
    path: path.resolve(__dirname, "..", ".env"),
  });
});

test("admin provisioning reports a missing MongoDB URI without exposing its value", () => {
  assert.throws(
    () => getMongoUri({}),
    (error) => {
      assert.equal(error.message, "MONGODB_URI is missing. Set it in backend/.env or the process environment.");
      return true;
    },
  );
  assert.equal(getMongoUri({ MONGODB_URI: "mongodb://example.test/db" }), "mongodb://example.test/db");
});
