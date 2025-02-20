// controllers/dashboard.controller.js
const db = require("../config/db");
const path = require("path");
const fs = require("fs").promises;
const { existsSync } = require("fs");
const uploadFolder = path.join(__dirname, "../uploads/test-files");

// Utility function to safely process test results
const processTestResults = (jsonContent) => {
  try {
    const results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      timedOutTests: 0,
      erroredTests: 0,
      canceledTests: 0,
      duration: 0,
    };

    // Handle direct stats if available
    if (jsonContent.stats) {
      results.totalTests = jsonContent.stats.tests || 0;
      results.passedTests = jsonContent.stats.passes || 0;
      results.failedTests = jsonContent.stats.failures || 0;
      results.duration = jsonContent.stats.duration || 0;
      // If we have complete stats, return early
      if (results.totalTests > 0) {
        return results;
      }
    }

    // Process detailed results if stats are not complete
    if (jsonContent.results) {
      jsonContent.results.forEach((result) => {
        // Handle flat test structure
        if (Array.isArray(result.tests)) {
          result.tests.forEach((test) => {
            processTestCase(test, results);
          });
        }

        // Handle nested suites
        if (Array.isArray(result.suites)) {
          result.suites.forEach((suite) => {
            processSuite(suite, results);
          });
        }
      });
    }

    return results;
  } catch (error) {
    console.error("Error processing test results:", error);
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      timedOutTests: 0,
      erroredTests: 0,
      canceledTests: 0,
      duration: 0,
    };
  }
};

// Helper function to process a test suite recursively
const processSuite = (suite, results) => {
  if (Array.isArray(suite.tests)) {
    suite.tests.forEach((test) => {
      processTestCase(test, results);
    });
  }

  if (Array.isArray(suite.suites)) {
    suite.suites.forEach((childSuite) => {
      processSuite(childSuite, results);
    });
  }
};

// Helper function to process individual test case
const processTestCase = (test, results) => {
  results.totalTests++;

  if (test.state === "passed" || test.pass) {
    results.passedTests++;
  } else if (test.state === "failed" || test.fail) {
    results.failedTests++;
  } else if (test.timedOut) {
    results.timedOutTests++;
  } else if (test.err && Object.keys(test.err).length > 0) {
    results.erroredTests++;
  } else if (test.skipped || test.pending) {
    results.canceledTests++;
  }

  if (test.duration) {
    results.duration += test.duration;
  }
};

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

  getSprintStackedChartData: async (req, res) => {
    const connection = await db.getConnection();
    try {
      const [sprints] = await connection.execute(
        `SELECT s.*, 
         COUNT(tf.file_id) as test_files_count
         FROM sprints s
         LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
         WHERE s.project_id = ?
         GROUP BY s.sprint_id
         ORDER BY s.start_date`,
        [req.params.projectId]
      );

      const sprintData = await Promise.all(
        sprints.map(async (sprint) => {
          const [files] = await connection.execute(
            `SELECT tf.* 
             FROM test_files tf
             WHERE tf.sprint_id = ? AND tf.status != 'Deleted'
             ORDER BY tf.upload_date DESC`,
            [sprint.sprint_id]
          );

          let aggregatedResults = {
            passedTests: 0,
            failedTests: 0,
            timedOutTests: 0,
            erroredTests: 0,
            canceledTests: 0,
            totalTests: 0,
            totalDuration: 0,
          };

          await Promise.all(
            files.map(async (file) => {
              try {
                const filePath = path.join(
                  uploadFolder,
                  file.original_filename
                );
                if (existsSync(filePath)) {
                  const content = await fs.readFile(filePath, "utf8");
                  const jsonContent = JSON.parse(content);

                  const results = processTestResults(jsonContent);

                  // Aggregate results
                  Object.keys(results).forEach((key) => {
                    if (key === "duration") {
                      aggregatedResults.totalDuration += results[key];
                    } else {
                      aggregatedResults[key] += results[key];
                    }
                  });
                }
              } catch (error) {
                console.error(
                  `Error processing file ${file.original_filename}:`,
                  error
                );
              }
            })
          );

          return {
            sprintName: sprint.name,
            startDate: sprint.start_date,
            endDate: sprint.end_date,
            ...aggregatedResults,
          };
        })
      );

      res.json(sprintData);
    } catch (error) {
      console.error("Error fetching sprint stacked chart data:", error);
      res.status(500).json({ error: "Failed to fetch sprint chart data" });
    } finally {
      connection.release();
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
