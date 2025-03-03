// sprintController.js
const db = require("../config/db");

// Helper function to validate sprint sequence
const validateSprintSequence = async (projectId, sprintNumber) => {
  const [sprints] = await db.query(
    `SELECT name, 
            CAST(SUBSTRING(name, 7) AS UNSIGNED) as sprint_number
     FROM sprints 
     WHERE project_id = ? 
     ORDER BY sprint_number`,
    [projectId]
  );

  for (let i = 1; i < sprintNumber; i++) {
    const exists = sprints.some((s) => parseInt(s.name.split(" ")[1]) === i);
    if (!exists) {
      throw new Error(
        `Cannot create Sprint ${sprintNumber}. Sprint ${i} does not exist.`
      );
    }
  }

  return true;
};

// Helper function to check date overlaps
const checkDateOverlap = async (
  projectId,
  startDate,
  endDate,
  excludeSprintId = null
) => {
  let query = `
    SELECT name, start_date, end_date 
    FROM sprints 
    WHERE project_id = ? 
    AND ((start_date BETWEEN ? AND ?) 
    OR (end_date BETWEEN ? AND ?))
  `;
  const params = [projectId, startDate, endDate, startDate, endDate];

  if (excludeSprintId) {
    query += " AND sprint_id != ?";
    params.push(excludeSprintId);
  }

  const [overlappingSprints] = await db.query(query, params);
  return overlappingSprints;
};

// Get next sprint number for a project
const getNextSprintNumber = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [projectId]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    const [sprints] = await db.query(
      `SELECT name,
              CAST(SUBSTRING(name, 7) AS UNSIGNED) as sprint_number
       FROM sprints 
       WHERE project_id = ? 
       ORDER BY sprint_number DESC 
       LIMIT 1`,
      [projectId]
    );

    let nextNumber = 1;

    if (sprints.length > 0) {
      const lastSprintNumber = parseInt(sprints[0].sprint_number);
      nextNumber = lastSprintNumber + 1;

      try {
        await validateSprintSequence(projectId, nextNumber);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    return res.json({
      next_number: nextNumber,
      sprint_name: `Sprint ${nextNumber}`,
      existing_sprints: sprints.map((s) => ({
        name: s.name,
        number: s.sprint_number,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error getting next sprint number",
      error: error.message,
    });
  }
};

// Create new sprint
const createSprint = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.body;

    // Validate project exists
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [project_id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get and validate next sprint number
    const [lastSprint] = await db.query(
      `SELECT name, 
              CAST(SUBSTRING(name, 7) AS UNSIGNED) as sprint_number
       FROM sprints 
       WHERE project_id = ? 
       ORDER BY sprint_number DESC 
       LIMIT 1`,
      [project_id]
    );

    const nextNumber = lastSprint.length ? lastSprint[0].sprint_number + 1 : 1;

    try {
      await validateSprintSequence(project_id, nextNumber);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Check for date overlaps
    const overlappingSprints = await checkDateOverlap(
      project_id,
      start_date,
      end_date
    );
    if (overlappingSprints.length > 0) {
      return res.status(400).json({
        message: "Sprint dates overlap with existing sprint",
        overlapping_sprint: overlappingSprints[0],
      });
    }

    // Generate sprint name
    const sprintName = `Sprint ${nextNumber}`;

    // Create sprint
    const [result] = await db.query(
      `INSERT INTO sprints 
       (name, project_id, start_date, end_date, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [sprintName, project_id, start_date, end_date, req.user.name]
    );

    // Log action
    await db.query(
      `INSERT INTO action_logs 
       (user_id, action_type, target_table, target_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        "create",
        "sprints",
        result.insertId,
        JSON.stringify({ ...req.body, name: sprintName }),
      ]
    );

    res.status(201).json({
      message: "Sprint created successfully",
      sprint_id: result.insertId,
      name: sprintName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all sprints
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

    query +=
      " GROUP BY s.sprint_id ORDER BY CAST(SUBSTRING(s.name, 7) AS UNSIGNED)";

    const [sprints] = await db.query(query, queryParams);
    res.json(sprints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get sprint by ID
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

    // Get associated test files
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

// Update sprint
const updateSprint = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    const sprintId = req.params.id;

    // Check if sprint exists
    const [sprint] = await db.query(
      "SELECT * FROM sprints WHERE sprint_id = ?",
      [sprintId]
    );

    if (!sprint.length) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    // Check for date overlaps (excluding current sprint)
    const overlappingSprints = await checkDateOverlap(
      sprint[0].project_id,
      start_date,
      end_date,
      sprintId
    );

    if (overlappingSprints.length > 0) {
      return res.status(400).json({
        message: "Sprint dates overlap with existing sprint",
        overlapping_sprint: overlappingSprints[0],
      });
    }

    // Update sprint
    await db.query(
      `UPDATE sprints 
       SET start_date = ?, end_date = ?, updated_by = ? 
       WHERE sprint_id = ?`,
      [start_date, end_date, req.user.name, sprintId]
    );

    // Log action
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

const deleteSprint = async (req, res) => {
  try {
    const sprintId = req.params.id;

    // Check if sprint exists
    const [sprint] = await db.query(
      "SELECT * FROM sprints WHERE sprint_id = ?",
      [sprintId]
    );

    if (!sprint.length) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    // Check for active test files (exclude files with "Deleted" status)
    const [testFiles] = await db.query(
      "SELECT COUNT(*) as count FROM test_files WHERE sprint_id = ? AND status != 'Deleted'",
      [sprintId]
    );

    if (testFiles[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete sprint with existing test files",
        test_files_count: testFiles[0].count,
      });
    }

    // Check if it's the last sprint in sequence
    const [laterSprints] = await db.query(
      `SELECT COUNT(*) as count 
       FROM sprints 
       WHERE project_id = ? 
       AND CAST(SUBSTRING(name, 7) AS UNSIGNED) > ?`,
      [sprint[0].project_id, parseInt(sprint[0].name.split(" ")[1])]
    );

    if (laterSprints[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete sprint. Later sprints exist in sequence.",
      });
    }

    // Delete sprint
    await db.query("DELETE FROM sprints WHERE sprint_id = ?", [sprintId]);

    // Log action
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

// Get sprint date ranges
const getSprintDateRanges = async (req, res) => {
  try {
    const projectId = req.query.project_id;

    const [sprints] = await db.query(
      `SELECT name, start_date, end_date 
       FROM sprints 
       WHERE project_id = ? 
       ORDER BY CAST(SUBSTRING(name, 7) AS UNSIGNED)`,
      [projectId]
    );

    res.json(sprints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get sprint statistics
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
  getNextSprintNumber,
  createSprint,
  getAllSprints,
  getSprintById,
  updateSprint,
  deleteSprint,
  getSprintDateRanges,
  getSprintStats,
};
