const mongoose = require("mongoose");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const User = require("../models/User");

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Combined Mathematics",
];
const MEDIUMS = ["Sinhala", "English", "Tamil"];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function isAdmin(user) {
  return user?.role === "admin";
}

function isTeacher(user) {
  return (
    user?.role === "teacher" &&
    user.isActive === true &&
    user.approvalStatus === "approved"
  );
}

function validationResponse(res, error) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: Object.values(error.errors).map((item) => item.message),
  });
}

async function validateTeacherId(id) {
  if (!mongoose.isValidObjectId(id)) return false;
  const teacher = await User.findOne({
    _id: id,
    role: "teacher",
    approvalStatus: "approved",
    isActive: true,
  });
  return Boolean(teacher);
}

async function getCourses(req, res) {
  try {
    const filter = {};
    if (isAdmin(req.user)) {
      if (req.query.teacherId !== undefined) {
        if (!mongoose.isValidObjectId(req.query.teacherId)) {
          return res.status(400).json({ success: false, message: "Invalid teacher ID" });
        }
        filter.teacherId = req.query.teacherId;
      }
    } else if (isTeacher(req.user)) {
      filter.teacherId = req.user.id;
    } else {
      filter.status = "published";
    }

    if (req.query.subject !== undefined) {
      if (!SUBJECTS.includes(req.query.subject)) {
        return res.status(400).json({ success: false, message: "Invalid subject" });
      }
      filter.subject = req.query.subject;
    }
    if (req.query.medium !== undefined) {
      if (!MEDIUMS.includes(req.query.medium)) {
        return res.status(400).json({ success: false, message: "Invalid medium" });
      }
      filter.medium = req.query.medium;
    }
    if (req.query.academicYear !== undefined) {
      const academicYear = Number(req.query.academicYear);
      if (!Number.isInteger(academicYear) || academicYear < 2000 || academicYear > 2100) {
        return res.status(400).json({ success: false, message: "Invalid academic year" });
      }
      filter.academicYear = academicYear;
    }
    if (req.query.status !== undefined && (isAdmin(req.user) || isTeacher(req.user))) {
      if (!["draft", "published"].includes(req.query.status)) {
        return res.status(400).json({ success: false, message: "Invalid course status" });
      }
      filter.status = req.query.status;
    }
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filter.title = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to retrieve courses" });
  }
}

async function getCourseById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }
    const course = await Course.findById(req.params.id);
    if (
      !course ||
      (course.status !== "published" &&
        !isAdmin(req.user) &&
        !(isTeacher(req.user) && String(course.teacherId) === String(req.user.id)))
    ) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    return res.status(200).json({ success: true, data: course });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to retrieve course" });
  }
}

async function createCourse(req, res) {
  try {
    const teacherId = isAdmin(req.user) ? req.body.teacherId : req.user.id;
    if (!await validateTeacherId(teacherId)) {
      return res.status(400).json({ success: false, message: "A valid approved teacher is required" });
    }
    const course = await Course.create({
      title: req.body.title,
      description: req.body.description,
      subject: req.body.subject,
      medium: req.body.medium,
      academicYear: req.body.academicYear,
      status: req.body.status,
      teacherId,
    });
    return res.status(201).json({ success: true, message: "Course created successfully", data: course });
  } catch (error) {
    if (error.name === "ValidationError") return validationResponse(res, error);
    return res.status(500).json({ success: false, message: "Failed to create course" });
  }
}

async function updateCourse(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }
    const fields = ["title", "description", "subject", "medium", "academicYear", "status"];
    const updates = {};
    for (const field of fields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update" });
    }
    const filter = { _id: req.params.id };
    if (!isAdmin(req.user)) filter.teacherId = req.user.id;
    const course = await Course.findOneAndUpdate(filter, updates, {
      new: true,
      runValidators: true,
    });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    return res.status(200).json({ success: true, message: "Course updated successfully", data: course });
  } catch (error) {
    if (error.name === "ValidationError") return validationResponse(res, error);
    return res.status(500).json({ success: false, message: "Failed to update course" });
  }
}

async function deleteCourse(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }
    const filter = { _id: req.params.id };
    if (!isAdmin(req.user)) filter.teacherId = req.user.id;
    const course = await Course.findOne(filter);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const [lessonCount, enrollmentCount] = await Promise.all([
      Lesson.countDocuments({ courseId: course._id }),
      Enrollment.countDocuments({ courseId: course._id }),
    ]);
    if (lessonCount || enrollmentCount) {
      return res.status(409).json({
        success: false,
        message: "Remove the course lessons and enrollments before deleting this course.",
      });
    }
    await Course.deleteOne({ _id: course._id });
    return res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to delete course" });
  }
}

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
