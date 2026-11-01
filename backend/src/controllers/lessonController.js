const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const Course = require("../models/Course");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function canAccessDraftLessons(user) {
  return (
    user?.role === "teacher" &&
    user.isActive === true &&
    user.approvalStatus === "approved"
  );
}

function ownsLesson(lesson, user) {
  return Boolean(
    lesson?.createdBy &&
      user?.id &&
      String(lesson.createdBy) === String(user.id)
  );
}

function withoutOwner(lesson) {
  const result =
    typeof lesson?.toObject === "function"
      ? lesson.toObject()
      : { ...lesson };
  delete result.createdBy;
  return result;
}

// CREATE a new lesson
const createLesson = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "A valid course ID is required",
      });
    }
    const course = await Course.findOne({
      _id: courseId,
      teacherId: req.user.id,
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    const { title, subject, description, lessonUrl, notesUrl, status } =
      req.body;

    const lesson = await Lesson.create({
      title,
      subject,
      description,
      lessonUrl,
      notesUrl,
      status,
      createdBy: req.user.id,
      courseId,
    });

    res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      data: withoutOwner(lesson),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create lesson",
    });
  }
};

// READ all lessons with optional search and filters
const getLessons = async (req, res) => {
  try {
    const { search, subject, status, sort = "newest" } = req.query;
    const canAccessDrafts = canAccessDraftLessons(req.user);

    const filter = canAccessDrafts ? { createdBy: req.user.id } : {};

    if (req.query.courseId !== undefined) {
      if (!mongoose.isValidObjectId(req.query.courseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }
      filter.courseId = req.query.courseId;
    }
    if (subject) filter.subject = subject;
    if (canAccessDrafts) {
      if (status) filter.status = status;
    } else {
      filter.status = "published";
    }

    if (typeof search === "string" && search.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: "i" };
    }

    const sortOption =
      sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const lessons = await Lesson.find(filter).sort(sortOption);

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons.map(withoutOwner),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve lessons",
    });
  }
};

// READ a single lesson
const getLessonById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    if (
      lesson.status !== "published" &&
      (!canAccessDraftLessons(req.user) || !ownsLesson(lesson, req.user))
    ) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    res.status(200).json({
      success: true,
      data: withoutOwner(lesson),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve lesson",
    });
  }
};

// UPDATE a lesson
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const allowedFields = [
      "courseId",
      "title",
      "subject",
      "description",
      "lessonUrl",
      "notesUrl",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (updates.courseId !== undefined) {
      if (!mongoose.isValidObjectId(updates.courseId)) {
        return res.status(400).json({
          success: false,
          message: "A valid course ID is required",
        });
      }
      const course = await Course.findOne({
        _id: updates.courseId,
        teacherId: req.user.id,
      });
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }
    }

    const lesson = await Lesson.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: withoutOwner(lesson),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update lesson",
    });
  }
};

// DELETE a lesson
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const lesson = await Lesson.findOneAndDelete({
      _id: id,
      createdBy: req.user.id,
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete lesson",
    });
  }
};

module.exports = {
  createLesson,
  getLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
};