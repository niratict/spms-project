// middleware/projectPermission.js
const db = require("../config/db");

/**
 * ตรวจสอบสิทธิ์การจัดการโปรเจกต์ (สำหรับ Product Owner และ Admin)
 */
const canManageProject = async (req, res, next) => {
  try {
    // แก้ไขการดึงค่า project_id ให้รองรับทั้งรูปแบบ params
    const projectId =
      req.params.project_id || req.params.id || req.body.project_id;

    // ถ้าเป็น Admin ให้ผ่านไปได้เลย
    if (req.user.role === "Admin") {
      return next();
    }

    // ถ้าไม่มี project_id ในคำขอ
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // ตรวจสอบว่าผู้ใช้เป็น Product Owner ของโปรเจกต์นี้หรือไม่
    const [member] = await db.query(
      `SELECT * 
       FROM project_members 
       WHERE project_id = ? AND user_id = ? AND role = 'Product Owner'`,
      [projectId, req.user.user_id]
    );

    if (member.length > 0) {
      return next();
    }

    // ตรวจสอบสิทธิ์จากตาราง project_permissions ถ้ามี
    const [permissions] = await db.query(
      `SELECT can_manage_project 
       FROM project_permissions 
       WHERE project_id = ? AND user_id = ?`,
      [projectId, req.user.user_id]
    );

    if (permissions.length > 0 && permissions[0].can_manage_project) {
      return next();
    }

    return res.status(403).json({
      message: "You don't have permission to manage this project",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ตรวจสอบสิทธิ์การดูโปรเจกต์ (สำหรับ Product Owner, Tester และ Admin)
 */
const canViewProject = async (req, res, next) => {
  try {
    const projectId = req.params.project_id || req.params.id;

    // ถ้าเป็น Admin ให้ผ่านไปได้เลย
    if (req.user.role === "Admin") {
      return next();
    }

    // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของโปรเจกต์หรือไม่
    const [member] = await db.query(
      `SELECT * 
       FROM project_members 
       WHERE project_id = ? AND user_id = ?`,
      [projectId, req.user.user_id]
    );

    if (member.length === 0) {
      return res.status(403).json({
        message: "You don't have permission to view this project",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ตรวจสอบสิทธิ์การจัดการไฟล์ทดสอบ (สำหรับ Product Owner, Tester และ Admin)
 */
const canManageFiles = async (req, res, next) => {
  try {
    const projectId = req.params.project_id || req.body.project_id;

    // ถ้าเป็น Admin ให้ผ่านไปได้เลย
    if (req.user.role === "Admin") {
      return next();
    }

    // ถ้าไม่มี project_id ในคำขอ
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // ตรวจสอบว่าเป็น Product Owner หรือไม่
    const [member] = await db.query(
      `SELECT * 
       FROM project_members 
       WHERE project_id = ? AND user_id = ?`,
      [projectId, req.user.user_id]
    );

    if (
      member.length > 0 &&
      (member[0].role === "Product Owner" || member[0].role === "Tester")
    ) {
      return next();
    }

    // ตรวจสอบสิทธิ์ในการจัดการไฟล์
    const [permissions] = await db.query(
      `SELECT can_manage_files 
       FROM project_permissions 
       WHERE project_id = ? AND user_id = ?`,
      [projectId, req.user.user_id]
    );

    if (permissions.length === 0 || !permissions[0].can_manage_files) {
      return res.status(403).json({
        message:
          "You don't have permission to manage test files in this project",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ตรวจสอบสิทธิ์ในการเพิ่มสมาชิกโปรเจกต์
 */
const canAddProjectMember = async (req, res, next) => {
  try {
    const { project_id, role } = req.body;

    // ตรวจสอบว่ามี project_id ในคำขอ
    if (!project_id) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // ถ้าเป็น Admin สามารถเพิ่มสมาชิกได้ทุกบทบาท
    if (req.user.role === "Admin") {
      return next();
    }

    // ถ้าเป็น Product Owner สามารถเพิ่มเฉพาะ Tester
    if (req.user.role === "Product Owner" && role === "Tester") {
      // ตรวจสอบว่าเป็น Product Owner ของโปรเจกต์นี้หรือไม่
      const [isProductOwner] = await db.query(
        `SELECT * 
         FROM project_members 
         WHERE project_id = ? AND user_id = ? AND role = 'Product Owner'`,
        [project_id, req.user.user_id]
      );

      if (isProductOwner.length > 0) {
        return next();
      }
    }

    res.status(403).json({
      message:
        "You don't have permission to add this type of member to the project",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  canManageProject,
  canViewProject,
  canManageFiles,
  canAddProjectMember,
};
