const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// CREATE a new lesson
const createLesson = async (req, res) => {
  try {
    const { title, subject, description, lessonUrl, notesUrl, status } =
      req.body;

    const lesson = await Lesson.create({
      title,
      subject,
      description,
      lessonUrl,
      notesUrl,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      data: lesson,
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

    const filter = {};

    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    if (typeof search === "string" && search.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: "i" };
    }

    const sortOption =
      sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const lessons = await Lesson.find(filter).sort(sortOption);

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons,
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

    res.status(200).json({
      success: true,
      data: lesson,
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

    const lesson = await Lesson.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: lesson,
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

    const lesson = await Lesson.findByIdAndDelete(id);

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