const mongoose = require("mongoose");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const COURSE_FIELDS = "title description subject medium academicYear status teacherId";
const STUDENT_FIELDS = "name email";

function isAdmin(user) {
  return user?.role === "admin";
}

function isApprovedTeacher(user) {
  return (
    user?.role === "teacher" &&
    user.isActive === true &&
    user.approvalStatus === "approved"
  );
}

function populateEnrollment(query) {
  return query
    .populate("courseId", COURSE_FIELDS)
    .populate("studentId", STUDENT_FIELDS);
}

async function enrollInCourse(req, res) {
  try {
    const { courseId } = req.params;
    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findOne({ _id: courseId, status: "published" });
    if (!course) return res.status(404).json({ success: false, message: "Published course not found" });

    const existing = await Enrollment.findOne({
      studentId: req.user.id,
      courseId,
    });
    if (existing?.status === "enrolled") {
      return res.status(409).json({ success: false, message: "You are already enrolled in this course" });
    }

    if (existing) {
      const enrollment = await populateEnrollment(
        Enrollment.findOneAndUpdate(
          { _id: existing._id, studentId: req.user.id, status: "cancelled" },
          { status: "enrolled", enrolledAt: new Date() },
          { new: true, runValidators: true },
        ),
      );
      if (!enrollment) {
        return res.status(409).json({ success: false, message: "Enrollment status changed; please refresh and try again" });
      }
      return res.status(200).json({ success: true, message: "Course enrollment restored", data: enrollment });
    }

    const enrollment = await Enrollment.create({
      studentId: req.user.id,
      courseId,
      status: "enrolled",
    });
    const populated = await populateEnrollment(
      Enrollment.findById(enrollment._id),
    );
    return res.status(201).json({ success: true, message: "Enrolled in course successfully", data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You are already enrolled in this course" });
    }
    return res.status(500).json({ success: false, message: "Failed to enroll in course" });
  }
}

async function getMyEnrollments(req, res) {
  try {
    const enrollments = await populateEnrollment(
      Enrollment.find({ studentId: req.user.id, status: "enrolled" }).sort({ enrolledAt: -1 }),
    );
    return res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to retrieve enrollments" });
  }
}

async function cancelEnrollment(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid enrollment ID" });
    }
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, studentId: req.user.id, status: "enrolled" },
      { status: "cancelled" },
      { new: true, runValidators: true },
    );
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }
    return res.status(200).json({ success: true, message: "Enrollment cancelled", data: enrollment });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to cancel enrollment" });
  }
}

async function getCourseEnrollments(req, res) {
  try {
    const { courseId } = req.params;
    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }
    if (!isAdmin(req.user)) {
      const course = await Course.findOne({ _id: courseId, teacherId: req.user.id });
      if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    }

    const enrollments = await populateEnrollment(
      Enrollment.find({ courseId, status: "enrolled" }).sort({ enrolledAt: -1 }),
    );
    return res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to retrieve course enrollments" });
  }
}

async function getAllEnrollments(req, res) {
  try {
    const filter = { status: "enrolled" };
    if (req.query.courseId !== undefined) {
      if (!mongoose.isValidObjectId(req.query.courseId)) {
        return res.status(400).json({ success: false, message: "Invalid course ID" });
      }
      filter.courseId = req.query.courseId;
    }
    const enrollments = await populateEnrollment(
      Enrollment.find(filter).sort({ enrolledAt: -1 }),
    );
    return res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to retrieve enrollments" });
  }
}

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  cancelEnrollment,
  getCourseEnrollments,
  getAllEnrollments,
  isApprovedTeacher,
  isAdmin,
};
