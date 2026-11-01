const readline = require("node:readline/promises");
const path = require("node:path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../src/models/User");

class ProvisioningError extends Error {}
const sensitiveValues = new Set();
const ENV_PATH = path.resolve(__dirname, "..", ".env");

function loadEnvironment(config = dotenv.config) {
  return config({ path: ENV_PATH });
}

function getMongoUri(environment = process.env) {
  if (!environment.MONGODB_URI) {
    throw new ProvisioningError(
      "MONGODB_URI is missing. Set it in backend/.env or the process environment.",
    );
  }
  return environment.MONGODB_URI;
}

function classifyProvisioningError(error) {
  if (error instanceof ProvisioningError) return "Input";
  if (error?.code === 11000) return "Duplicate admin email";
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return "Validation";
  }
  if (
    error?.code === 13 ||
    error?.code === 18 ||
    /authentication failed|not authorized|unauthorized|permission denied/i.test(
      error?.message || "",
    )
  ) {
    return "MongoDB authentication/permission";
  }
  if (
    /ServerSelectionError|MongoNetwork|TopologyClosed|MongooseServerSelectionError/i.test(
      error?.name || "",
    ) ||
    /server selection|could not connect|connection timed out|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET/i.test(
      error?.message || "",
    )
  ) {
    return "MongoDB connection";
  }
  return "Unexpected";
}

function toError(error) {
  return error instanceof Error ? error : new Error(String(error));
}

function sanitizeDiagnostic(value, secrets = []) {
  let message = String(value ?? "");
  const knownSecrets = [process.env.MONGODB_URI, ...sensitiveValues, ...secrets]
    .filter((secret) => typeof secret === "string" && secret.length > 0)
    .sort((left, right) => right.length - left.length);

  for (const secret of knownSecrets) {
    message = message.split(secret).join("[REDACTED]");
  }

  return message
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, "[REDACTED_MONGODB_URI]")
    .replace(
      /((?:password|passwd|pwd|token|secret|api[_-]?key)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      "$1[REDACTED]",
    );
}

function formatProvisioningError(error, secrets = []) {
  const category = classifyProvisioningError(error);
  const name = sanitizeDiagnostic(error?.name || "Error", secrets);
  const message = sanitizeDiagnostic(error?.message || String(error), secrets);
  return `[${category}] ${name}: ${message}`;
}

function promptHidden(label) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    return Promise.reject(
      new ProvisioningError("Admin provisioning requires an interactive terminal.")
    );
  }

  process.stdout.write(label);
  input.setRawMode(true);
  input.resume();
  input.setEncoding("utf8");

  return new Promise((resolve, reject) => {
    let value = "";

    function finish(result, error) {
      input.removeListener("data", handleInput);
      input.setRawMode(false);
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(result);
    }

    function handleInput(key) {
      if (key === "\u0003") {
        finish(null, new ProvisioningError("Admin provisioning was cancelled."));
      } else if (key === "\u0004") {
        finish(null, new ProvisioningError("Admin provisioning was cancelled."));
      } else if (key === "\r" || key === "\n") {
        finish(value);
      } else if (key === "\u007f" || key === "\b") {
        value = value.slice(0, -1);
      } else if (!/[\u0000-\u001f\u007f]/.test(key)) {
        value += key;
      }
    }

    input.on("data", handleInput);
  });
}

async function main() {
  loadEnvironment();
  const mongoUri = getMongoUri();

  const prompts = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let name;
  let email;
  try {
    name = (await prompts.question("Admin name: ")).trim();
    email = (await prompts.question("Admin email: ")).trim().toLowerCase();
  } finally {
    prompts.close();
  }

  if (name.length < 2 || name.length > 100) {
    throw new ProvisioningError("Name must contain between 2 and 100 characters.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ProvisioningError("Enter a valid email address.");
  }

  const password = await promptHidden("Admin password (input hidden): ");
  sensitiveValues.add(password);
  const confirmation = await promptHidden("Confirm password (input hidden): ");
  sensitiveValues.add(confirmation);
  if (password !== confirmation) {
    throw new ProvisioningError("The passwords do not match.");
  }
  if (
    !password.trim() ||
    password.length < 8 ||
    password.length > 128 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new ProvisioningError("Password must be at least 8 characters and at most 72 UTF-8 bytes.");
  }

  let operationError;
  try {
    await mongoose.connect(mongoUri);
    const existingUser = await User.findOne({ email }).select("_id");
    if (existingUser) {
      throw new ProvisioningError("An account with that email already exists.");
    }

    const admin = new User({
      name,
      email,
      password,
      role: "admin",
      approvalStatus: "approved",
      isActive: true,
    });
    try {
      await admin.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ProvisioningError("An account with that email already exists.");
      }
      throw error;
    }
    process.stdout.write(`Admin account created for ${email}.\n`);
  } catch (error) {
    operationError = toError(error);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (error) {
      if (operationError) {
        operationError.cleanupError = toError(error);
      } else {
        operationError = toError(error);
      }
    }
  }

  if (operationError) {
    if (operationError.cleanupError) {
      const cleanup = operationError.cleanupError;
      operationError.message += ` (connection cleanup also failed: ${cleanup.name}: ${cleanup.message})`;
    }
    throw operationError;
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${formatProvisioningError(error)}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  classifyProvisioningError,
  formatProvisioningError,
  getMongoUri,
  loadEnvironment,
  sanitizeDiagnostic,
};
