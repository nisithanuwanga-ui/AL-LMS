const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_MAX_PASSWORD_BYTES = 72;
const BCRYPT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [EMAIL_PATTERN, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must contain at least 8 characters"],
      maxlength: [128, "Password cannot exceed 128 characters"],
      select: false,
      validate: {
        validator(value) {
          return (
            typeof value === "string" &&
            Buffer.byteLength(value, "utf8") <= BCRYPT_MAX_PASSWORD_BYTES
          );
        },
        message: "Password cannot exceed 72 UTF-8 bytes",
      },
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default() {
        return this.role === "teacher" ? "pending" : "approved";
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, result) {
        delete result.password;
        return result;
      },
    },
    toObject: {
      transform(_document, result) {
        delete result.password;
        return result;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre("validate", function applyApprovalDefault() {
  if (this.isNew && !this.isModified("approvalStatus")) {
    this.approvalStatus = this.role === "teacher" ? "pending" : "approved";
  }
});

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

module.exports = mongoose.model("User", userSchema);
