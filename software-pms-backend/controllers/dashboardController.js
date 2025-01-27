// controllers/dashboard.controller.js
const db = require("../config/db");
const path = require("path");
const fs = require("fs").promises;
const { existsSync } = require("fs");
const uploadFolder = path.join(__dirname, "../uploads/test-files");

const dashboardController = {
  // Get Dashboard Stats
  getDashboardStats: async (req, res) => {
    try {
      const [stats] = await db.query(`
        SELECT 
          COUNT(DISTINCT p.project_id) as total_projects,
          COUNT(DISTINCT s.sprint_id) as total_sprints,
          COUNT(DISTINCT tf.file_id) as total_test_files,
          COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
          COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests,
          ROUND(COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) * 100.0 / 
            NULLIF(COUNT(DISTINCT tf.file_id), 0), 2) as pass_rate
        FROM projects p
        LEFT JOIN sprints s ON p.project_id = s.project_id
        LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
        WHERE p.status != 'On Hold'
      `);

      /*
       await db.query(
        `INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.user_id, "view", "dashboard", null, JSON.stringify(stats[0])]
      );
      */

      res.json(stats[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get All Projects
  getAllProjects: async (req, res) => {
    try {
      const [projects] = await db.query(`
        SELECT p.*, 
          COUNT(DISTINCT s.sprint_id) as sprint_count,
          COUNT(DISTINCT tf.file_id) as test_files_count,
          COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
          ROUND(COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) * 100.0 / 
            NULLIF(COUNT(DISTINCT tf.file_id), 0), 2) as pass_rate
        FROM projects p
        LEFT JOIN sprints s ON p.project_id = s.project_id
        LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
        GROUP BY p.project_id
      `);

      /* Disable Actionlog View Dashboard
      await db.query(
        `INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.user_id, "view", "projects", null, null]
      );
      */

      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get Project Sprints
  getProjectSprints: async (req, res) => {
    try {
      const [sprints] = await db.query(
        `
        SELECT s.*, 
          COUNT(tf.file_id) as test_files_count,
          COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
          COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests,
          ROUND(COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) * 100.0 / 
            NULLIF(COUNT(DISTINCT tf.file_id), 0), 2) as pass_rate
        FROM sprints s
        LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
        WHERE s.project_id = ?
        GROUP BY s.sprint_id
      `,
        [req.params.projectId]
      );
      /*
      await db.query(
        `INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.user.user_id,
          "view",
          "project_sprints",
          req.params.projectId,
          null,
        ]
      );
      */
      res.json(sprints);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get Project Test Results
  getProjectTestResults: async (req, res) => {
    const connection = await db.getConnection();
    try {
      const [files] = await connection.execute(
        `
        SELECT tf.*, 
          p.name as project_name,
          s.name as sprint_name
        FROM test_files tf
        JOIN sprints s ON tf.sprint_id = s.sprint_id
        JOIN projects p ON s.project_id = p.project_id
        WHERE p.project_id = ?
        ORDER BY tf.upload_date DESC
      `,
        [req.params.projectId]
      );

      // Read JSON content for each file
      const filesWithContent = await Promise.all(
        files.map(async (file) => {
          try {
            const filePath = path.join(uploadFolder, file.original_filename);
            if (existsSync(filePath)) {
              const content = await fs.readFile(filePath, "utf8");
              file.json_content = JSON.parse(content);
            } else {
              file.json_content = null;
              console.warn(`File not found: ${filePath}`);
            }
          } catch (error) {
            console.error(
              `Error reading file ${file.original_filename}:`,
              error
            );
            file.json_content = null;
          }
          return file;
        })
      );
      /*
      await db.query(
        `INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.user.user_id,
          "view",
          "project_test_results",
          req.params.projectId,
          null,
        ]
      );
      */
      res.json(filesWithContent);
    } catch (error) {
      console.error("Error fetching all test results:", error);
      res.status(500).json({ error: "Failed to fetch test results" });
    } finally {
      connection.release();
    }
  },

  // Get Project Sprint Results
  getProjectSprintResults: async (req, res) => {
    try {
      const [results] = await db.query(
        `
        SELECT 
          s.name as sprint_name,
          COUNT(tf.file_id) as total_tests,
          COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
          COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests,
          ROUND(COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) * 100.0 / 
            NULLIF(COUNT(DISTINCT tf.file_id), 0), 2) as pass_rate
        FROM sprints s
        LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
        WHERE s.project_id = ?
        GROUP BY s.sprint_id, s.name
        ORDER BY s.start_date
      `,
        [req.params.projectId]
      );
      /*
      await db.query(
        `INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.user_id, "view", "sprint_results", req.params.projectId, null]
      );
      */
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get Sprint Test Files
  getSprintTestFiles: async (req, res) => {
    const connection = await db.getConnection();
    try {
      const [files] = await connection.execute(
        `
        SELECT tf.*, 
          p.name as project_name,
          s.name as sprint_name
        FROM test_files tf
        JOIN sprints s ON tf.sprint_id = s.sprint_id
        JOIN projects p ON s.project_id = p.project_id
        WHERE tf.sprint_id = ?
        ORDER BY tf.upload_date DESC
      `,
        [req.params.sprintId]
      );

      // อ่านข้อมูล JSON สำหรับแต่ละไฟล์
      const filesWithContent = await Promise.all(
        files.map(async (file) => {
          try {
            const filePath = path.join(uploadFolder, file.original_filename);
            if (existsSync(filePath)) {
              const content = await fs.readFile(filePath, "utf8");
              file.json_content = JSON.parse(content);
            } else {
              file.json_content = null;
              console.warn(`File not found: ${filePath}`);
            }
          } catch (error) {
            console.error(
              `Error reading file ${file.original_filename}:`,
              error
            );
            file.json_content = null;
          }
          return file;
        })
      );
      /*
      await db.query(
        `INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.user.user_id,
          "view",
          "sprint_test_files",
          req.params.sprintId,
          null,
        ]
      );
      */
      res.json(filesWithContent);
    } catch (error) {
      console.error("Error fetching test files:", error);
      res.status(500).json({ error: "Failed to fetch test files" });
    } finally {
      connection.release();
    }
  },
};

module.exports = dashboardController;
