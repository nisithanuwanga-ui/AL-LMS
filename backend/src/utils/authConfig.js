const AUTH_COOKIE_NAME = "nisova_auth";
const JWT_EXPIRES_IN_SECONDS = 60 * 60;
const MIN_JWT_SECRET_LENGTH = 32;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (
    typeof secret !== "string" ||
    secret.trim().length < MIN_JWT_SECRET_LENGTH
  ) {
    throw new Error("JWT authentication is not configured.");
  }

  return secret;
}

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: JWT_EXPIRES_IN_SECONDS * 1000,
  };
}

function toPublicUser(user) {
  return {
    id: String(user._id ?? user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus,
  };
}

module.exports = {
  AUTH_COOKIE_NAME,
  JWT_EXPIRES_IN_SECONDS,
  getJwtSecret,
  getAuthCookieOptions,
  toPublicUser,
};
