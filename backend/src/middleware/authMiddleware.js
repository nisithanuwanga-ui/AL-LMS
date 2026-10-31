const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AUTH_COOKIE_NAME, getJwtSecret, toPublicUser } = require("../utils/authConfig");

function sendUnauthorized(res) {
  return res.status(401).json({
    success: false,
    message: "Authentication is required.",
  });
}

async function authMiddleware(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) return sendUnauthorized(res);

  let secret;
  try {
    secret = getJwtSecret();
  } catch {
    return res.status(500).json({
      success: false,
      message: "Authentication is temporarily unavailable.",
    });
  }

  let claims;
  try {
    claims = jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return sendUnauthorized(res);
  }

  if (!claims || typeof claims !== "object" || typeof claims.sub !== "string") {
    return sendUnauthorized(res);
  }

  let user;
  try {
    user = await User.findById(claims.sub);
  } catch {
    return res.status(500).json({
      success: false,
      message: "An unexpected authentication error occurred.",
    });
  }

  if (!user) return sendUnauthorized(res);
  if (!user.isActive || (user.role === "teacher" && user.approvalStatus === "rejected")) {
    return res.status(403).json({
      success: false,
      message: "This account is not permitted to access this resource.",
    });
  }

  req.user = toPublicUser(user);
  Object.defineProperty(req.user, "isActive", {
    value: user.isActive === true,
    enumerable: false,
  });
  return next();
}

module.exports = authMiddleware;
