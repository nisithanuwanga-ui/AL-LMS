const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required() {
        return this.isNew;
      },
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: undefined,
    },

    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
      minlength: [3, "Title must contain at least 3 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      enum: {
        values: [
          "Physics",
          "Chemistry",
          "Biology",
          "Combined Mathematics",
        ],
        message: "Please select a valid subject",
      },
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    lessonUrl: {
      type: String,
      trim: true,
      default: "",
    },

    notesUrl: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Lesson", lessonSchema);