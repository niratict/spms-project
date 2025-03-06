const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");

// Load environment variables from .env file
dotenv.config();

const app = express();

// Global Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logger
app.use("/api/uploads", express.static("uploads"));

// Import Routes
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const sprintRoutes = require("./routes/sprintRoutes");
const testFileRoutes = require("./routes/testFileRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const mainDashboardRoutes = require("./routes/mainDashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const actionLogRoutes = require("./routes/actionLogRoutes");
const profileRoutes = require("./routes/profileRoutes");
const projectMemberRoutes = require("./routes/projectMemberRoutes");

// API Route Mounting
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/test-files", testFileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/main-dashboard", mainDashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/action-logs", actionLogRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/project-members", projectMemberRoutes);

// 404 Handler - For undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation Error",
      errors: err.errors,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized Access",
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong!",
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const db = require("./config/db");

// Use async/await to test database connection
(async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("Database connected and test query succeeded:", rows);
  } catch (err) {
    console.error("Database connection or query failed:", err.message);
  }
})();

module.exports = app;
