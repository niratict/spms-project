// sprintRoutes.js
const express = require("express");
const router = express.Router();
const sprintController = require("../controllers/sprintController");
const { auth } = require("../middleware/auth");

router.use(auth);

// ดึงข้อมูล sprints ทั้งหมด
router.get("/", sprintController.getAllSprints);

// ดึง date ranges สำหรับการตรวจสอบความซ้ำซ้อน
router.get("/date-ranges", sprintController.getSprintDateRanges);

// สร้าง sprint ใหม่
router.post("/", sprintController.createSprint);

// ดึงข้อมูล sprint ตาม ID
router.get("/:id", sprintController.getSprintById);

// อัพเดท sprint
router.put("/:id", sprintController.updateSprint);

// ลบ sprint
router.delete("/:id", sprintController.deleteSprint);

// ดึงสถิติของ sprint
router.get("/:id/stats", sprintController.getSprintStats);

// ตรวจสอบลำดับ sprint ถัดไป (เพิ่มเติม)
router.get("/next-number/:projectId", sprintController.getNextSprintNumber);

module.exports = router;
