const express = require("express");
const {
  registerStudent,
  registerTeacher,
  login,
  getCurrentUser,
  logout,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register/student", registerStudent);
router.post("/register/teacher", registerTeacher);
router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", logout);

module.exports = router;
