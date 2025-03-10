// controllers/dashboard.controller.js
const db = require("../config/db");
const path = require("path");
const fs = require("fs").promises;
const { existsSync } = require("fs");
// ยังคงเก็บ path ของ upload folder ไว้สำหรับการรองรับไฟล์เก่า
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

    // Handle direct stats if they're complete
    if (jsonContent.stats && jsonContent.stats.tests > 0) {
      results.totalTests = jsonContent.stats.tests || 0;
      results.passedTests = jsonContent.stats.passes || 0;
      results.failedTests = jsonContent.stats.failures || 0;
      results.duration = jsonContent.stats.duration || 0;
      return results;
    }

    // Process detailed results if stats are incomplete or missing
    if (jsonContent.results) {
      jsonContent.results.forEach((result) => {
        // Process root level tests if any
        if (Array.isArray(result.tests)) {
          result.tests.forEach((test) => {
            processTestCase(test, results);
          });
        }

        // Process suites recursively
        if (Array.isArray(result.suites)) {
          result.suites.forEach((suite) => {
            processSuiteAndNestedSuites(suite, results);
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

// New helper function to process both suite and its nested suites
const processSuiteAndNestedSuites = (suite, results) => {
  // Process tests in current suite
  if (Array.isArray(suite.tests)) {
    suite.tests.forEach((test) => {
      processTestCase(test, results);
    });
  }

  // Process nested suites
  if (Array.isArray(suite.suites)) {
    suite.suites.forEach((nestedSuite) => {
      processSuiteAndNestedSuites(nestedSuite, results);
    });
  }

  // Add suite duration if available
  if (suite.duration) {
    results.duration += suite.duration;
  }
};

// Enhanced helper function to process individual test case
const processTestCase = (test, results) => {
  results.totalTests++;

  // Handle different test result formats
  if (test.state === "passed" || test.pass === true) {
    results.passedTests++;
  } else if (test.state === "failed" || test.fail === true) {
    results.failedTests++;
  } else if (test.timedOut === true) {
    results.timedOutTests++;
  } else if (test.err && Object.keys(test.err).length > 0) {
    results.erroredTests++;
  } else if (test.skipped === true || test.pending === true) {
    results.canceledTests++;
  }

  // Add test duration if available
  if (typeof test.duration === "number") {
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

      res.json(sprints);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get Project Test Results - อ่านจาก DB แทน
  getProjectTestResults: async (req, res) => {
    const connection = await db.getConnection();
    try {
      const [files] = await connection.execute(
        `
      SELECT tf.*, 
        p.name as project_name,
        s.name as sprint_name,
        tf.json_content
      FROM test_files tf
      JOIN sprints s ON tf.sprint_id = s.sprint_id
      JOIN projects p ON s.project_id = p.project_id
      WHERE p.project_id = ?
      ORDER BY tf.upload_date DESC
    `,
        [req.params.projectId]
      );

      // แปลงข้อมูล JSON string เป็น object
      const filesWithContent = await Promise.all(
        files.map(async (file) => {
          try {
            if (file.json_content) {
              if (typeof file.json_content === "string") {
                file.json_content = JSON.parse(file.json_content);
              }
              // ถ้าเป็น object อยู่แล้วก็ใช้ได้เลย
            }
            // ถ้าไม่มีข้อมูลใน DB ให้ลองอ่านจากไฟล์เป็น fallback (สำหรับข้อมูลเก่า)
            else {
              const filePath = path.join(uploadFolder, file.original_filename);
              if (existsSync(filePath)) {
                try {
                  // ใช้ await fs.readFile แทน fs.readFileSync
                  const content = await fs.readFile(filePath, "utf8");
                  file.json_content = JSON.parse(content);
                } catch (error) {
                  console.error(
                    `Error reading file ${file.original_filename}:`,
                    error
                  );
                  file.json_content = null;
                }
              } else {
                console.warn(`File not found: ${filePath}`);
                file.json_content = null;
              }
            }
          } catch (error) {
            console.error(
              `Error parsing JSON for file ${file.file_id}:`,
              error
            );
            file.json_content = null;
          }
          return file;
        })
      );

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

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // แก้ไขส่วนของ getSprintStackedChartData
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
            `SELECT tf.*, tf.json_content 
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

          files.forEach((file) => {
            try {
              let jsonContent;

              // ถ้ามีข้อมูล JSON ใน DB ให้ใช้จาก DB
              if (file.json_content) {
                if (typeof file.json_content === "string") {
                  jsonContent = JSON.parse(file.json_content);
                } else {
                  jsonContent = file.json_content;
                }
              }
              // Fallback: ถ้าไม่มีข้อมูลใน DB ให้ลองอ่านจากไฟล์ (สำหรับข้อมูลเก่า)
              else {
                const filePath = path.join(
                  uploadFolder,
                  file.original_filename
                );
                if (existsSync(filePath)) {
                  const content = fs.readFileSync(filePath, "utf8");
                  jsonContent = JSON.parse(content);
                } else {
                  return; // ข้ามไฟล์นี้ถ้าไม่มีทั้งใน DB และ filesystem
                }
              }

              const results = processTestResults(jsonContent);

              // Aggregate results
              Object.keys(results).forEach((key) => {
                if (key === "duration") {
                  aggregatedResults.totalDuration += results[key];
                } else {
                  aggregatedResults[key] += results[key];
                }
              });
            } catch (error) {
              console.error(`Error processing file ${file.file_id}:`, error);
            }
          });

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
          s.name as sprint_name,
          tf.json_content
        FROM test_files tf
        JOIN sprints s ON tf.sprint_id = s.sprint_id
        JOIN projects p ON s.project_id = p.project_id
        WHERE tf.sprint_id = ?
        ORDER BY tf.upload_date DESC
      `,
        [req.params.sprintId]
      );

      // แปลงข้อมูล JSON string เป็น object
      const filesWithContent = files.map((file) => {
        try {
          if (file.json_content) {
            if (typeof file.json_content === "string") {
              file.json_content = JSON.parse(file.json_content);
            }
            // ถ้าเป็น object อยู่แล้วก็ใช้ได้เลย
          }
          // Fallback: ถ้าไม่มีข้อมูลใน DB ให้ลองอ่านจากไฟล์ (สำหรับข้อมูลเก่า)
          else {
            const filePath = path.join(uploadFolder, file.original_filename);
            if (existsSync(filePath)) {
              try {
                const content = fs.readFileSync(filePath, "utf8");
                file.json_content = JSON.parse(content);
              } catch (error) {
                console.error(
                  `Error reading file ${file.original_filename}:`,
                  error
                );
                file.json_content = null;
              }
            } else {
              file.json_content = null;
            }
          }
        } catch (error) {
          console.error(`Error parsing JSON for file ${file.file_id}:`, error);
          file.json_content = null;
        }
        return file;
      });

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
