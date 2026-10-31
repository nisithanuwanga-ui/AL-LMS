function sendUnauthorized(res) {
  return res.status(401).json({
    success: false,
    message: "Authentication is required.",
  });
}

function sendForbidden(res) {
  return res.status(403).json({
    success: false,
    message: "You do not have permission to access this resource.",
  });
}

function requireRole(...allowedRoles) {
  return function authorizeRole(req, res, next) {
    if (!req.user || typeof req.user !== "object") {
      return sendUnauthorized(res);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendForbidden(res);
    }

    return next();
  };
}

function requireApprovedTeacher(req, res, next) {
  if (!req.user || typeof req.user !== "object") {
    return sendUnauthorized(res);
  }

  if (
    req.user.role !== "teacher" ||
    req.user.isActive !== true ||
    req.user.approvalStatus !== "approved"
  ) {
    return sendForbidden(res);
  }

  return next();
}

module.exports = {
  requireRole,
  requireApprovedTeacher,
};
