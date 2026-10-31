const readline = require("node:readline/promises");
const mongoose = require("mongoose");
const User = require("../src/models/User");

class ProvisioningError extends Error {}

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
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be supplied through the process environment.");
  }

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
  const confirmation = await promptHidden("Confirm password (input hidden): ");
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

  await mongoose.connect(process.env.MONGODB_URI);
  try {
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
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  const message =
    error instanceof ProvisioningError
      ? error.message
      : "Admin provisioning failed. Check database connectivity and permissions.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
