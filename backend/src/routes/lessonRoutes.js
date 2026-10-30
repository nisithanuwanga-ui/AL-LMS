const express = require("express");

const {
  createLesson,
  getLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
} = require("../controllers/lessonController");

const router = express.Router();

// POST /api/lessons - Create a lesson
router.post("/", createLesson);

// GET /api/lessons - Get all lessons
router.get("/", getLessons);

// GET /api/lessons/:id - Get a single lesson
router.get("/:id", getLessonById);

// PUT /api/lessons/:id - Update a lesson
router.put("/:id", updateLesson);

// DELETE /api/lessons/:id - Delete a lesson
router.delete("/:id", deleteLesson);

module.exports = router;