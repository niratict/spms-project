// mainDashboardRoutes.js
const express = require("express");
const router = express.Router();
const mainDashboardController = require("../controllers/mainDashboardController");
const { auth } = require("../middleware/auth");

router.use(auth);

// Single endpoint to get all dashboard data
router.get("/stats", mainDashboardController.getDashboardStats);
// Endpoint for project activity chart data
router.get("/project-activity", mainDashboardController.getProjectActivity);
// New endpoint for test file activity
router.get("/test-file-activity", mainDashboardController.getTestFileActivity);

module.exports = router;
