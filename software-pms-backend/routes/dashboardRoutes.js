// routes/dashboard.routes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { auth } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(auth);

// Dashboard Stats
router.get("/stats", dashboardController.getDashboardStats);

// Project Routes
router.get("/projects", dashboardController.getAllProjects);
router.get(
  "/projects/:projectId/sprints",
  dashboardController.getProjectSprints
);
router.get(
  "/projects/:projectId/all-test-results",
  dashboardController.getProjectTestResults
);
router.get(
  "/projects/:projectId/sprint-results",
  dashboardController.getProjectSprintResults
);

// Test Files Routes
router.get("/test-files/:sprintId", dashboardController.getSprintTestFiles);

// Get Sprint Stacked Chart Data
router.get(
  "/projects/:projectId/sprint-stacked-chart",
  dashboardController.getSprintStackedChartData
);

module.exports = router;
