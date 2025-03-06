// controllers/projectMemberController.js
const db = require("../config/db");

/**
 * เพิ่มสมาชิกใหม่ให้โปรเจกต์
 */
const addProjectMember = async (req, res) => {
  try {
    const { project_id, user_id, role } = req.body;

    // ตรวจสอบว่าโปรเจกต์มีอยู่จริงหรือไม่
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [project_id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่จริงหรือไม่
    const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      user_id,
    ]);

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // ตรวจสอบว่าผู้ใช้ได้รับมอบหมายให้โปรเจกต์นี้แล้วหรือไม่
    const [existingMember] = await db.query(
      "SELECT * FROM project_members WHERE project_id = ? AND user_id = ?",
      [project_id, user_id]
    );

    if (existingMember.length > 0) {
      // อัปเดตบทบาทที่มีอยู่
      await db.query(
        `UPDATE project_members 
         SET role = ?, assigned_by = ?, assigned_at = CURRENT_TIMESTAMP 
         WHERE project_id = ? AND user_id = ?`,
        [role, req.user.user_id, project_id, user_id]
      );

      return res.json({
        message: "Project member role updated successfully",
      });
    }

    // เพิ่มสมาชิกใหม่
    await db.query(
      `INSERT INTO project_members 
       (project_id, user_id, role, assigned_by, assigned_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [project_id, user_id, role, req.user.user_id]
    );

    // บันทึก action log
    await db.query(
      `INSERT INTO action_logs 
       (user_id, action_type, target_table, target_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        "assign",
        "project_members",
        project_id,
        JSON.stringify({
          project_id,
          user_id,
          role,
          user_name: user[0].name,
        }),
      ]
    );

    res.status(201).json({
      message: "User added to project successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ลบสมาชิกออกจากโปรเจกต์
 */
const removeProjectMember = async (req, res) => {
  try {
    const { project_id, user_id } = req.params;

    // ตรวจสอบว่าสมาชิกนี้มีอยู่ในโปรเจกต์จริงหรือไม่
    const [member] = await db.query(
      "SELECT * FROM project_members WHERE project_id = ? AND user_id = ?",
      [project_id, user_id]
    );

    if (!member.length) {
      return res.status(404).json({
        message: "Member not found in this project",
      });
    }

    // ตรวจสอบว่า Admin สามารถลบ Product Owner ได้
    // และ Product Owner สามารถลบ Tester ได้
    if (req.user.role !== "Admin" && member[0].role === "Product Owner") {
      return res.status(403).json({
        message: "Only Admin can remove a Product Owner from a project",
      });
    }

    // ลบสมาชิกออกจากโปรเจกต์
    await db.query(
      "DELETE FROM project_members WHERE project_id = ? AND user_id = ?",
      [project_id, user_id]
    );

    // บันทึก action log
    await db.query(
      `INSERT INTO action_logs 
       (user_id, action_type, target_table, target_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        "remove",
        "project_members",
        project_id,
        JSON.stringify({ project_id, user_id, member: member[0] }),
      ]
    );

    res.json({ message: "Member removed from project successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ดึงรายชื่อสมาชิกในโปรเจกต์
 */
const getProjectMembers = async (req, res) => {
  try {
    const { project_id } = req.params;

    // ตรวจสอบว่าโปรเจกต์มีอยู่จริงหรือไม่
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [project_id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ดึงรายชื่อสมาชิกพร้อมรายละเอียดผู้ใช้
    const [members] = await db.query(
      `SELECT pm.*, u.name, u.email, u.role as user_role,
       au.name as assigned_by_name
       FROM project_members pm
       JOIN users u ON pm.user_id = u.user_id
       JOIN users au ON pm.assigned_by = au.user_id
       WHERE pm.project_id = ?
       ORDER BY pm.role, u.name`,
      [project_id]
    );

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ดึงรายชื่อผู้ใช้ที่สามารถเพิ่มเป็นสมาชิกได้ (ยังไม่ได้เป็นสมาชิกในโปรเจกต์นี้)
 */
const getAvailableUsers = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { role } = req.query;

    let query = `
      SELECT u.user_id, u.name, u.email, u.role
      FROM users u
      WHERE u.user_id NOT IN (
        SELECT user_id FROM project_members WHERE project_id = ?
      )
    `;

    const params = [project_id];

    // ถ้าระบุบทบาทเฉพาะ
    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    // ถ้าเป็น Product Owner ให้แสดงเฉพาะ Tester
    if (req.user.role === "Product Owner") {
      query += ` AND u.role = 'Tester'`;
    }

    query += ` ORDER BY u.name`;

    const [users] = await db.query(query, params);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  getAvailableUsers,
};
