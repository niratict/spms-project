const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { auth } = require("../middleware/auth");
const {
  canManageProject,
  canViewProject,
} = require("../middleware/projectPermission");

router.use(auth);

// อัพเดท route ให้รองรับการอัพโหลดรูปภาพและตรวจสอบสิทธิ์
router.post(
  "/",
  projectController.upload.single("photo"),
  projectController.createProject
);

router.put(
  "/:id",
  canManageProject, // ตรวจสอบสิทธิ์ก่อนอนุญาตให้แก้ไข
  projectController.upload.single("photo"),
  projectController.updateProject
);

router.get("/", projectController.getAllProjects); // แสดงเฉพาะโปรเจกต์ที่มีสิทธิ์ (ปรับใน controller)
router.get("/:id", canViewProject, projectController.getProjectById); // ตรวจสอบสิทธิ์ก่อนดูรายละเอียด
router.delete("/:id", canManageProject, projectController.deleteProject); // ตรวจสอบสิทธิ์ก่อนลบ
router.get("/:id/stats", canViewProject, projectController.getProjectStats); // ตรวจสอบสิทธิ์ก่อนดูสถิติ

module.exports = router;
