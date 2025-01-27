const db = require("../config/db");

// สร้าง Project ใหม่
const createProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date } = req.body;
    const [result] = await db.query(
      "INSERT INTO projects (name, description, start_date, end_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      [name, description, start_date, end_date, "Active", req.user.name]
    );

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "create",
        "projects",
        result.insertId,
        JSON.stringify(req.body),
      ]
    );

    res.status(201).json({
      message: "Project created successfully",
      project_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงรายการ Project ทั้งหมด
const getAllProjects = async (req, res) => {
  try {
    // ดึงข้อมูล projects พร้อมจำนวน sprints
    const [projects] = await db.query(`
      SELECT p.*, 
        COUNT(DISTINCT s.sprint_id) as sprint_count,
        COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests
      FROM projects p
      LEFT JOIN sprints s ON p.project_id = s.project_id
      LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
      GROUP BY p.project_id
    `);

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงข้อมูล Project ตาม ID
const getProjectById = async (req, res) => {
  try {
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [req.params.id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ดึงข้อมูล sprints ที่เกี่ยวข้อง
    const [sprints] = await db.query(
      "SELECT * FROM sprints WHERE project_id = ?",
      [req.params.id]
    );

    project[0].sprints = sprints;

    res.json(project[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// อัพเดท Project
const updateProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date, status } = req.body;
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [req.params.id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    await db.query(
      `UPDATE projects 
       SET name = ?, description = ?, start_date = ?, 
           end_date = ?, status = ?, updated_by = ?
       WHERE project_id = ?`,
      [
        name,
        description,
        start_date,
        end_date,
        status,
        req.user.name,
        req.params.id,
      ]
    );

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "update",
        "projects",
        req.params.id,
        JSON.stringify(req.body),
      ]
    );

    res.json({ message: "Project updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ลบ Project
const deleteProject = async (req, res) => {
  try {
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [req.params.id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ตรวจสอบว่ามี Sprint ที่เกี่ยวข้องหรือไม่
    const [sprints] = await db.query(
      "SELECT COUNT(*) as count FROM sprints WHERE project_id = ?",
      [req.params.id]
    );

    if (sprints[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete project with existing sprints",
        sprint_count: sprints[0].count,
      });
    }

    await db.query("DELETE FROM projects WHERE project_id = ?", [
      req.params.id,
    ]);

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "delete",
        "projects",
        req.params.id,
        JSON.stringify(project[0]),
      ]
    );

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงสถิติของ Project
const getProjectStats = async (req, res) => {
  try {
    const [stats] = await db.query(
      `
      SELECT 
        p.project_id,
        p.name,
        COUNT(DISTINCT s.sprint_id) as total_sprints,
        COUNT(DISTINCT tf.file_id) as total_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests,
        ROUND(COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) * 100.0 / 
          NULLIF(COUNT(DISTINCT tf.file_id), 0), 2) as pass_rate
      FROM projects p
      LEFT JOIN sprints s ON p.project_id = s.project_id
      LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
      WHERE p.project_id = ?
      GROUP BY p.project_id
    `,
      [req.params.id]
    );

    if (!stats.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats,
};
