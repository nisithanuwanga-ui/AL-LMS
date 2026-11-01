const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");
const {
  enrollInCourse,
  getMyEnrollments,
  cancelEnrollment,
  getCourseEnrollments,
  getAllEnrollments,
  isApprovedTeacher,
  isAdmin,
} = require("../controllers/enrollmentController");

const router = express.Router();
const requireStudent = requireRole("student");
const requireTeacherOrAdmin = requireRole("teacher", "admin");
const requireAdmin = requireRole("admin");

function requireApprovedTeacherOrAdmin(req, res, next) {
  if (isAdmin(req.user) || isApprovedTeacher(req.user)) return next();
  return res.status(403).json({
    success: false,
    message: "An active, approved teacher account is required.",
  });
}

router.post("/courses/:courseId", authMiddleware, requireStudent, enrollInCourse);
router.get("/mine", authMiddleware, requireStudent, getMyEnrollments);
router.patch("/:id/cancel", authMiddleware, requireStudent, cancelEnrollment);
router.get("/course/:courseId", authMiddleware, requireTeacherOrAdmin, requireApprovedTeacherOrAdmin, getCourseEnrollments);
router.get("/", authMiddleware, requireAdmin, getAllEnrollments);

module.exports = router;
