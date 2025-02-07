const db = require("../config/db");

// ดึงรายการ Action Logs ทั้งหมด
const getAllActionLogs = async (req, res) => {
  try {
    const {
      user_id,
      action_type,
      target_table,
      start_date,
      end_date,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = `
      SELECT 
        al.*,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        COALESCE(p.name, s.name, f.filename, us.name) AS target_name
      FROM action_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN projects p ON al.target_table = 'projects' AND al.target_id = p.project_id
      LEFT JOIN sprints s ON al.target_table = 'sprints' AND al.target_id = s.sprint_id
      LEFT JOIN test_files f ON al.target_table = 'test_files' AND al.target_id = f.file_id
      LEFT JOIN users us ON al.target_table = 'users' AND al.target_id = us.user_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (user_id) {
      query += " AND al.user_id = ?";
      queryParams.push(user_id);
    }
    if (action_type) {
      query += " AND al.action_type = ?";
      queryParams.push(action_type);
    }
    if (target_table) {
      query += " AND al.target_table = ?";
      queryParams.push(target_table);
    }
    if (start_date) {
      query += " AND al.action_date >= ?";
      queryParams.push(start_date);
    }
    if (end_date) {
      query += " AND al.action_date <= ?";
      queryParams.push(end_date);
    }
    if (req.user.role !== "Admin") {
      query += " AND al.user_id = ?";
      queryParams.push(req.user.user_id);
    }

    const [totalRows] = await db.query(
      `SELECT COUNT(*) as total FROM (${query}) as filtered_logs`,
      queryParams
    );

    query += " ORDER BY al.action_date DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [logs] = await db.query(query, queryParams);

    res.json({
      total: totalRows[0].total,
      offset: parseInt(offset),
      limit: parseInt(limit),
      logs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึง Action Log ตาม ID
const getActionLogById = async (req, res) => {
  try {
    const [log] = await db.query(
      `
      SELECT 
        al.*,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        COALESCE(p.name, s.name, f.filename, us.name) AS target_name
      FROM action_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN projects p ON al.target_table = 'projects' AND al.target_id = p.project_id
      LEFT JOIN sprints s ON al.target_table = 'sprints' AND al.target_id = s.sprint_id
      LEFT JOIN test_files f ON al.target_table = 'test_files' AND al.target_id = f.file_id
      LEFT JOIN users us ON al.target_table = 'users' AND al.target_id = us.user_id
      WHERE al.log_id = ?
    `,
      [req.params.id]
    );

    if (!log.length) {
      return res.status(404).json({ message: "Action log not found" });
    }

    if (req.user.role !== "Admin" && log[0].user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Permission denied" });
    }

    res.json(log[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึง Action Types ที่มีในระบบ
const getActionTypes = async (req, res) => {
  try {
    const [types] = await db.query(`
      SELECT DISTINCT action_type
      FROM action_logs
      ORDER BY action_type
    `);

    res.json(types.map((type) => type.action_type));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึง Target Tables ที่มีในระบบ
const getTargetTables = async (req, res) => {
  try {
    const [tables] = await db.query(`
      SELECT DISTINCT target_table
      FROM action_logs
      ORDER BY target_table
    `);

    res.json(tables.map((table) => table.target_table));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงสถิติ Action Logs
const getActionLogStats = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ Admin)
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Permission denied" });
    }

    const { start_date, end_date } = req.query;

    let dateCondition = "1=1";
    const queryParams = [];

    if (start_date && end_date) {
      dateCondition = "action_date BETWEEN ? AND ?";
      queryParams.push(start_date, end_date);
    }

    const [stats] = await db.query(
      `
      SELECT
        COUNT(*) as total_actions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT target_table) as affected_tables,
        (
          SELECT action_type
          FROM action_logs
          WHERE ${dateCondition}
          GROUP BY action_type
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as most_common_action,
        (
          SELECT target_table
          FROM action_logs
          WHERE ${dateCondition}
          GROUP BY target_table
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as most_affected_table,
        (
          SELECT DATE_FORMAT(action_date, '%Y-%m-%d')
          FROM action_logs
          WHERE ${dateCondition}
          GROUP BY DATE_FORMAT(action_date, '%Y-%m-%d')
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as busiest_day
      FROM action_logs
      WHERE ${dateCondition}
    `,
      queryParams
    );

    // ดึงสถิติแยกตาม action_type
    const [actionTypeStats] = await db.query(
      `
      SELECT 
        action_type,
        COUNT(*) as count
      FROM action_logs
      WHERE ${dateCondition}
      GROUP BY action_type
      ORDER BY count DESC
    `,
      queryParams
    );

    // ดึงสถิติแยกตาม target_table
    const [tableStats] = await db.query(
      `
      SELECT 
        target_table,
        COUNT(*) as count
      FROM action_logs
      WHERE ${dateCondition}
      GROUP BY target_table
      ORDER BY count DESC
    `,
      queryParams
    );

    // ดึงผู้ใช้ที่มีการทำงานมากที่สุด
    const [topUsers] = await db.query(
      `
      SELECT 
        al.user_id,
        u.name,
        u.role,
        COUNT(*) as action_count
      FROM action_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE ${dateCondition}
      GROUP BY al.user_id
      ORDER BY action_count DESC
      LIMIT 5
    `,
      queryParams
    );

    res.json({
      overview: stats[0],
      action_type_stats: actionTypeStats,
      table_stats: tableStats,
      top_users: topUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึง Timeline ของ Target
const getTargetTimeline = async (req, res) => {
  try {
    const { target_table, target_id } = req.query;

    if (!target_table || !target_id) {
      return res.status(400).json({
        message: "Target table and target ID are required",
      });
    }

    const [timeline] = await db.query(
      `
      SELECT 
        al.*,
        u.name as user_name,
        u.role as user_role
      FROM action_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE al.target_table = ? 
      AND al.target_id = ?
      ORDER BY al.action_date DESC
    `,
      [target_table, target_id]
    );

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllActionLogs,
  getActionLogById,
  getActionTypes,
  getTargetTables,
  getActionLogStats,
  getTargetTimeline,
};
