const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { AUTH_COOKIE_NAME } = require("../utils/authConfig");
const { requireApprovedTeacher } = require("../middleware/requireRole");

const {
  createLesson,
  getLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
} = require("../controllers/lessonController");

const router = express.Router();

function optionalAuthentication(req, res, next) {
  if (!req.cookies?.[AUTH_COOKIE_NAME]) {
    return next();
  }

  return authMiddleware(req, res, next);
}

// POST /api/lessons - Create a lesson
router.post("/", authMiddleware, requireApprovedTeacher, createLesson);

// GET /api/lessons - Get all lessons
router.get("/", optionalAuthentication, getLessons);

// GET /api/lessons/:id - Get a single lesson
router.get("/:id", optionalAuthentication, getLessonById);

// PUT /api/lessons/:id - Update a lesson
router.put("/:id", authMiddleware, requireApprovedTeacher, updateLesson);

// DELETE /api/lessons/:id - Delete a lesson
router.delete("/:id", authMiddleware, requireApprovedTeacher, deleteLesson);

module.exports = router;