// projectRoutes.js
const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { auth } = require("../middleware/auth");

router.use(auth); // Now correctly using the auth middleware

router.post("/", projectController.createProject);
router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);
router.get("/:id/stats", projectController.getProjectStats);

module.exports = router;
