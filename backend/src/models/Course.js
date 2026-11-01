const mongoose = require("mongoose");

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Combined Mathematics",
];
const MEDIUMS = ["Sinhala", "English", "Tamil"];

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      minlength: [3, "Course title must contain at least 3 characters"],
      maxlength: [150, "Course title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      trim: true,
      maxlength: [2000, "Course description cannot exceed 2000 characters"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      enum: SUBJECTS,
    },
    medium: {
      type: String,
      required: [true, "Medium is required"],
      enum: MEDIUMS,
    },
    academicYear: {
      type: Number,
      required: [true, "Academic year is required"],
      min: 2000,
      max: 2100,
      validate: {
        validator: Number.isInteger,
        message: "Academic year must be a whole number",
      },
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true },
);

courseSchema.index({ teacherId: 1, status: 1 });
courseSchema.index({ subject: 1, medium: 1, academicYear: 1, status: 1 });

module.exports = mongoose.model("Course", courseSchema);
