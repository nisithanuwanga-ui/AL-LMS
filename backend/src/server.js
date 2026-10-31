
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const lessonRoutes = require("./routes/lessonRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI;

if (CLIENT_URL === "*") {
  throw new Error("CLIENT_URL must be a specific origin when credentialed CORS is enabled.");
}

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/lessons", lessonRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Request body must be valid JSON.",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

app.get("/", (req, res) => {
  res.json({ message: "AL LMS Backend API is running!" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "AL LMS Backend",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

async function startServer() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB Atlas connected successfully");

  app.listen(PORT, () => {
    console.log(`AL LMS backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start AL LMS backend:", error.message);
  process.exit(1);
});
