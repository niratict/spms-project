const db = require("../config/db");

// สร้าง Sprint ใหม่
const createSprint = async (req, res) => {
  try {
    const { name, project_id, start_date, end_date } = req.body;

    // ตรวจสอบว่า Project มีอยู่จริง
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [project_id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ตรวจสอบว่าช่วงเวลาของ Sprint ไม่ทับซ้อนกับ Sprint อื่นในโปรเจคเดียวกัน
    const [overlappingSprints] = await db.query(
      `
      SELECT * FROM sprints 
      WHERE project_id = ? 
      AND ((start_date BETWEEN ? AND ?) 
      OR (end_date BETWEEN ? AND ?))`,
      [project_id, start_date, end_date, start_date, end_date]
    );

    if (overlappingSprints.length > 0) {
      return res.status(400).json({
        message: "Sprint dates overlap with existing sprint in this project",
      });
    }

    // สร้าง Sprint ใหม่
    const [result] = await db.query(
      `INSERT INTO sprints 
       (name, project_id, start_date, end_date, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, project_id, start_date, end_date, req.user.name]
    );

    // บันทึก action log
    await db.query(
      `INSERT INTO action_logs 
       (user_id, action_type, target_table, target_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        "create",
        "sprints",
        result.insertId,
        JSON.stringify(req.body),
      ]
    );

    res.status(201).json({
      message: "Sprint created successfully",
      sprint_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงรายการ Sprint ทั้งหมด
const getAllSprints = async (req, res) => {
  try {
    const projectId = req.query.project_id;
    let query = `
      SELECT s.*, 
        p.name as project_name,
        COUNT(DISTINCT tf.file_id) as total_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests
      FROM sprints s
      LEFT JOIN projects p ON s.project_id = p.project_id
      LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
    `;

    const queryParams = [];
    if (projectId) {
      query += " WHERE s.project_id = ?";
      queryParams.push(projectId);
    }

    query += " GROUP BY s.sprint_id";

    const [sprints] = await db.query(query, queryParams);
    res.json(sprints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงข้อมูล Sprint ตาม ID
const getSprintById = async (req, res) => {
  try {
    const [sprint] = await db.query(
      `
      SELECT s.*, 
        p.name as project_name,
        COUNT(DISTINCT tf.file_id) as total_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests
      FROM sprints s
      LEFT JOIN projects p ON s.project_id = p.project_id
      LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
      WHERE s.sprint_id = ?
      GROUP BY s.sprint_id
    `,
      [req.params.id]
    );

    if (!sprint.length) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    // ดึงข้อมูล test files ที่เกี่ยวข้อง
    const [testFiles] = await db.query(
      "SELECT * FROM test_files WHERE sprint_id = ?",
      [req.params.id]
    );

    sprint[0].test_files = testFiles;

    res.json(sprint[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// อัพเดท Sprint
const updateSprint = async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;
    const sprintId = req.params.id;

    // ตรวจสอบว่า Sprint มีอยู่จริง
    const [sprint] = await db.query(
      "SELECT * FROM sprints WHERE sprint_id = ?",
      [sprintId]
    );

    if (!sprint.length) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    // ตรวจสอบว่าช่วงเวลาไม่ทับซ้อนกับ Sprint อื่น (ยกเว้น Sprint ปัจจุบัน)
    const [overlappingSprints] = await db.query(
      `
      SELECT * FROM sprints 
      WHERE project_id = ? 
      AND sprint_id != ?
      AND ((start_date BETWEEN ? AND ?) 
      OR (end_date BETWEEN ? AND ?))`,
      [
        sprint[0].project_id,
        sprintId,
        start_date,
        end_date,
        start_date,
        end_date,
      ]
    );

    if (overlappingSprints.length > 0) {
      return res.status(400).json({
        message: "Sprint dates overlap with existing sprint in this project",
      });
    }

    // อัพเดท Sprint
    await db.query(
      `UPDATE sprints 
       SET name = ?, start_date = ?, end_date = ?, updated_by = ? 
       WHERE sprint_id = ?`,
      [name, start_date, end_date, req.user.name, sprintId]
    );

    // บันทึก action log
    await db.query(
      `INSERT INTO action_logs 
       (user_id, action_type, target_table, target_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        "update",
        "sprints",
        sprintId,
        JSON.stringify(req.body),
      ]
    );

    res.json({ message: "Sprint updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ลบ Sprint
const deleteSprint = async (req, res) => {
  try {
    const sprintId = req.params.id;

    // ตรวจสอบว่า Sprint มีอยู่จริง
    const [sprint] = await db.query(
      "SELECT * FROM sprints WHERE sprint_id = ?",
      [sprintId]
    );

    if (!sprint.length) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    // ตรวจสอบว่ามี Test Files ที่เกี่ยวข้องหรือไม่
    const [testFiles] = await db.query(
      "SELECT COUNT(*) as count FROM test_files WHERE sprint_id = ?",
      [sprintId]
    );

    if (testFiles[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete sprint with existing test files",
        test_files_count: testFiles[0].count,
      });
    }

    // ลบ Sprint
    await db.query("DELETE FROM sprints WHERE sprint_id = ?", [sprintId]);

    // บันทึก action log
    await db.query(
      `INSERT INTO action_logs 
       (user_id, action_type, target_table, target_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        "delete",
        "sprints",
        sprintId,
        JSON.stringify(sprint[0]),
      ]
    );

    res.json({ message: "Sprint deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงสถิติของ Sprint
const getSprintStats = async (req, res) => {
  try {
    const [stats] = await db.query(
      `
      SELECT 
        COUNT(DISTINCT tf.file_id) as total_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests,
        ROUND(COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) * 100.0 / 
          NULLIF(COUNT(DISTINCT tf.file_id), 0), 2) as pass_rate
      FROM sprints s
      LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
      WHERE s.sprint_id = ?
      GROUP BY s.sprint_id
    `,
      [req.params.id]
    );

    if (!stats.length) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSprint,
  getAllSprints,
  getSprintById,
  updateSprint,
  deleteSprint,
  getSprintStats,
};
