const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole, requireApprovedTeacher } = require("../middleware/requireRole");
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");

const router = express.Router();
const { AUTH_COOKIE_NAME } = require("../utils/authConfig");

function optionalAuthentication(req, res, next) {
  if (!req.cookies?.[AUTH_COOKIE_NAME]) return next();
  return authMiddleware(req, res, next);
}

function requireCourseManager(req, res, next) {
  if (req.user?.role === "admin") return next();
  return requireApprovedTeacher(req, res, next);
}

router.get("/", optionalAuthentication, getCourses);
router.get("/:id", optionalAuthentication, getCourseById);
router.post("/", authMiddleware, requireCourseManager, createCourse);
router.put("/:id", authMiddleware, requireCourseManager, updateCourse);
router.delete("/:id", authMiddleware, requireCourseManager, deleteCourse);

module.exports = router;
