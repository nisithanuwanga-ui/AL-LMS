const mongoose = require("mongoose");
const User = require("../models/User");
const { toPublicUser } = require("../utils/authConfig");

async function getPendingTeachers(_req, res) {
  try {
    const teachers = await User.find({
      role: "teacher",
      approvalStatus: "pending",
    })
      .select("name email role approvalStatus")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers.map(toPublicUser),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pending teacher applications.",
    });
  }
}

async function updateTeacherApproval(req, res) {
  const { id } = req.params;
  const { action } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid teacher ID.",
    });
  }

  if (action !== "approve" && action !== "reject") {
    return res.status(400).json({
      success: false,
      message: "Action must be either approve or reject.",
    });
  }

  try {
    const approvalStatus = action === "approve" ? "approved" : "rejected";
    const user = await User.findOneAndUpdate(
      {
        _id: id,
        role: "teacher",
        approvalStatus: "pending",
      },
      {
        $set: {
          approvalStatus,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email role approvalStatus");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Pending teacher application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Teacher application ${approvalStatus} successfully.`,
      user: toPublicUser(user),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Teacher approval update is invalid.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update teacher approval.",
    });
  }
}

module.exports = {
  getPendingTeachers,
  updateTeacherApproval,
};
