export function getRoleHome(user) {
  if (user?.role === "admin") return "/admin";
  if (user?.role === "teacher") {
    return user.approvalStatus === "approved"
      ? "/teacher/dashboard"
      : "/teacher/pending";
  }
  if (user?.role === "student") return "/student/dashboard";
  return "/";
}

export function getProtectedRouteDecision(
  status,
  user,
  roles,
  { allowPendingTeacher = false, allowPublic = false } = {},
) {
  if (status === "loading") return { type: "loading" };
  if (status === "error") {
    return allowPublic ? { type: "render" } : { type: "error" };
  }
  if (status !== "authenticated" || !user) {
    return allowPublic
      ? { type: "render" }
      : { type: "redirect", to: "/login" };
  }
  if (roles && !roles.includes(user.role)) {
    return { type: "redirect", to: getRoleHome(user) };
  }

  if (user.role === "teacher") {
    if (user.approvalStatus === "pending") {
      return allowPendingTeacher
        ? { type: "render" }
        : { type: "redirect", to: "/teacher/pending" };
    }
    // /auth/me rejects inactive users while keeping isActive out of public user data.
    if (user.approvalStatus !== "approved" || user.isActive === false) {
      return { type: "redirect", to: "/" };
    }
    if (allowPendingTeacher) {
      return { type: "redirect", to: "/teacher/dashboard" };
    }
  }

  return { type: "render" };
}
