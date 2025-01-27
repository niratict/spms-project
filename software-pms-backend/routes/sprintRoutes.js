// sprintRoutes.js
const express = require("express");
const router = express.Router();
const sprintController = require("../controllers/sprintController");
const { auth } = require("../middleware/auth");

router.use(auth);

router.post("/", sprintController.createSprint);
router.get("/", sprintController.getAllSprints);
router.get("/:id", sprintController.getSprintById);
router.put("/:id", sprintController.updateSprint);
router.delete("/:id", sprintController.deleteSprint);
router.get("/:id/stats", sprintController.getSprintStats);

module.exports = router;
