
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AL LMS Backend API is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "AL LMS Backend",
  });
});

app.listen(PORT, () => {
  console.log(`AL LMS backend running on http://localhost:${PORT}`);
});
