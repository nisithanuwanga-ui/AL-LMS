const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  AUTH_COOKIE_NAME,
  JWT_EXPIRES_IN_SECONDS,
  getAuthCookieOptions,
  getJwtSecret,
  toPublicUser,
} = require("../utils/authConfig");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const BCRYPT_MAX_PASSWORD_BYTES = 72;

function validateRegistrationInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A JSON object is required.";
  }

  if (["role", "approvalStatus", "isActive"].some((field) =>
    Object.hasOwn(body, field),
  )) {
    return "Role, approval status, and active status cannot be supplied.";
  }

  const { name, email, password } = body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return "Name, email, and password are required.";
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password.trim()) {
    return "Name, email, and password cannot be empty.";
  }

  if (
    normalizedName.length < MIN_NAME_LENGTH ||
    normalizedName.length > MAX_NAME_LENGTH
  ) {
    return "Name must contain between 2 and 100 characters.";
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return "Please provide a valid email address.";
  }

  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH ||
    Buffer.byteLength(password, "utf8") > BCRYPT_MAX_PASSWORD_BYTES
  ) {
    return "Password must contain at least 8 characters and cannot exceed 72 UTF-8 bytes.";
  }

  return null;
}

function sendValidationError(res, error) {
  const validationMessages = Object.values(error.errors || {})
    .map((item) => item.message)
    .filter(Boolean);

  return res.status(400).json({
    success: false,
    message: validationMessages.length
      ? validationMessages.join(" ")
      : "Registration details are invalid.",
  });
}

function createRegistrationHandler(role, approvalStatus) {
  return async function register(req, res) {
    const inputError = validateRegistrationInput(req.body);
    if (inputError) {
      return res.status(400).json({ success: false, message: inputError });
    }

    const user = new User({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      password: req.body.password,
      role,
      approvalStatus,
    });

    try {
      await user.validate();
      await user.save();

      return res.status(201).json({
        success: true,
        message: "Registration successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          approvalStatus: user.approvalStatus,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists.",
        });
      }

      if (error.name === "ValidationError") {
        return sendValidationError(res, error);
      }

      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred during registration.",
      });
    }
  };
}

const registerStudent = createRegistrationHandler("student", "approved");
const registerTeacher = createRegistrationHandler("teacher", "pending");

async function login(req, res) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "A JSON object is required.",
    });
  }

  if (["role", "approvalStatus", "isActive"].some((field) =>
    Object.hasOwn(body, field),
  )) {
    return res.status(400).json({
      success: false,
      message: "Role, approval status, and active status cannot be supplied.",
    });
  }

  const { email, password } = body;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password.trim() ||
    !EMAIL_PATTERN.test(email.trim().toLowerCase())
  ) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  let secret;
  try {
    secret = getJwtSecret();
  } catch {
    return res.status(500).json({
      success: false,
      message: "Authentication is temporarily unavailable.",
    });
  }

  try {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive || (user.role === "teacher" && user.approvalStatus === "rejected")) {
      return res.status(403).json({
        success: false,
        message: "This account is not permitted to sign in.",
      });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      secret,
      {
        algorithm: "HS256",
        expiresIn: JWT_EXPIRES_IN_SECONDS,
      },
    );

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: toPublicUser(user),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login.",
    });
  }
}

function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

function logout(_req, res) {
  const { maxAge: _maxAge, ...clearOptions } = getAuthCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
  return res.status(200).json({
    success: true,
    message: "Logout successful.",
  });
}

module.exports = {
  registerStudent,
  registerTeacher,
  login,
  getCurrentUser,
  logout,
};
