// actionLogRoutes.js
const express = require("express");
const router = express.Router();
const actionLogController = require("../controllers/actionLogController");
const { auth, authorizeRole } = require("../middleware/auth");

router.use(auth);

router.get("/", actionLogController.getAllActionLogs);
router.get("/types", actionLogController.getActionTypes);
router.get("/tables", actionLogController.getTargetTables);
router.get(
  "/stats",
  authorizeRole(["admin"]),
  actionLogController.getActionLogStats
);
router.get("/timeline", actionLogController.getTargetTimeline);
router.get("/:id", actionLogController.getActionLogById);

module.exports = router;
