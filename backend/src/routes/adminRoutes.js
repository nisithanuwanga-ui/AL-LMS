const express = require("express");
const {
  getPendingTeachers,
  updateTeacherApproval,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();
const requireAdmin = requireRole("admin");

router.get("/teachers/pending", authMiddleware, requireAdmin, getPendingTeachers);
router.patch(
  "/teachers/:id/approval",
  authMiddleware,
  requireAdmin,
  updateTeacherApproval
);

module.exports = router;
