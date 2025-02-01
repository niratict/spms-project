const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { auth } = require("../middleware/auth");

router.use(auth);

// อัพเดท route ให้รองรับการอัพโหลดรูปภาพ
router.post(
  "/",
  projectController.upload.single("photo"),
  projectController.createProject
);
router.put(
  "/:id",
  projectController.upload.single("photo"),
  projectController.updateProject
);

router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);
router.delete("/:id", projectController.deleteProject);
router.get("/:id/stats", projectController.getProjectStats);

module.exports = router;
