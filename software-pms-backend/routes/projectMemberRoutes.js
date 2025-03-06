// routes/projectMemberRoutes.js
const express = require("express");
const router = express.Router();
const projectMemberController = require("../controllers/projectMemberController");
const { auth } = require("../middleware/auth");
const { canManageProject, canAddProjectMember } = require("../middleware/projectPermission");

router.use(auth);

// เพิ่มสมาชิกใหม่ให้โปรเจกต์ (ต้องมีสิทธิ์เพิ่มสมาชิก)
router.post("/", canAddProjectMember, projectMemberController.addProjectMember);

// ลบสมาชิกออกจากโปรเจกต์ (ต้องมีสิทธิ์จัดการโปรเจกต์)
router.delete("/:project_id/:user_id", canManageProject, projectMemberController.removeProjectMember);

// ดึงรายชื่อสมาชิกในโปรเจกต์ (ต้องเป็นสมาชิกของโปรเจกต์)
router.get("/:project_id", projectMemberController.getProjectMembers);

// ดึงรายชื่อผู้ใช้ที่สามารถเพิ่มเป็นสมาชิกได้
router.get("/:project_id/available-users", canManageProject, projectMemberController.getAvailableUsers);

module.exports = router;