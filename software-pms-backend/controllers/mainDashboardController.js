const db = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    // Get projects stats
    const [projectStats] = await db.query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_projects
      FROM projects
    `);

    // Get total sprints count
    const [sprintStats] = await db.query(`
      SELECT COUNT(*) as total_sprints
      FROM sprints
    `);

    // Get test files stats
    const [fileStats] = await db.query(`
      SELECT 
        COUNT(*) as total_files,
        COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed_files,
        COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed_files,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_files
      FROM test_files
      WHERE status != 'Deleted'
    `);

    // Get latest projects with their sprint and file counts
    const [latestProjects] = await db.query(`
      SELECT 
        p.project_id,
        p.name,
        p.status,
        p.created_at,
        COUNT(DISTINCT s.sprint_id) as sprint_count,
        COUNT(DISTINCT CASE WHEN tf.status != 'Deleted' THEN tf.file_id END) as file_count
      FROM projects p
      LEFT JOIN sprints s ON p.project_id = s.project_id
      LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
      GROUP BY p.project_id
      ORDER BY p.created_at DESC
      LIMIT 3
    `);

    res.json({
      stats: {
        totalProjects: projectStats[0].total_projects,
        activeProjects: projectStats[0].active_projects,
        totalSprints: sprintStats[0].total_sprints,
        totalFiles: fileStats[0].total_files,
        passedFiles: fileStats[0].passed_files,
        failedFiles: fileStats[0].failed_files,
        pendingFiles: fileStats[0].pending_files,
      },
      latestProjects: latestProjects.map((project) => ({
        name: project.name,
        status: project.status,
        created_at: project.created_at,
        sprintCount: project.sprint_count,
        fileCount: project.file_count,
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getProjectActivity = async (req, res) => {
  try {
    // Get monthly project activity
    const [monthlyActivity] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as activity
      FROM projects
      WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `);

    // Transform data to match frontend expectations
    const monthlyStats = monthlyActivity.map((item) => ({
      month: item.month,
      activity: item.activity,
    }));

    res.json({
      monthlyActivity: monthlyStats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLatestTestFiles = async (req, res) => {
  try {
    // Get latest test files with their project and sprint information
    const [latestFiles] = await db.query(`
      SELECT 
        tf.file_id,
        tf.filename,
        tf.original_filename,
        tf.status,
        tf.upload_date,
        p.project_id,
        p.name as project_name,
        s.sprint_id,
        s.name as sprint_name
      FROM test_files tf
      JOIN sprints s ON tf.sprint_id = s.sprint_id
      JOIN projects p ON s.project_id = p.project_id
      WHERE tf.status != 'Deleted'
      ORDER BY tf.upload_date DESC
      LIMIT 6
    `);

    res.json({
      latestTestFiles: latestFiles.map((file) => ({
        fileId: file.file_id,
        filename: file.original_filename,
        status: file.status,
        uploadDate: file.upload_date,
        projectId: file.project_id,
        projectName: file.project_name,
        sprintId: file.sprint_id,
        sprintName: file.sprint_name,
      })),
    });
  } catch (error) {
    console.error("Latest test files error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getTestFileActivity = async (req, res) => {
  try {
    // Get monthly test file activity
    const [monthlyActivity] = await db.query(`
      SELECT 
        DATE_FORMAT(upload_date, '%Y-%m') as month,
        COUNT(CASE WHEN status != 'Deleted' THEN 1 END) as total_files,
        COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed_files,
        COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed_files
      FROM test_files
      WHERE upload_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(upload_date, '%Y-%m')
      ORDER BY month
    `);

    // Transform data to match frontend expectations
    const monthlyStats = monthlyActivity.map((item) => ({
      month: item.month,
      totalFiles: item.total_files,
      passedFiles: item.passed_files,
      failedFiles: item.failed_files,
    }));

    res.json({
      monthlyTestFileActivity: monthlyStats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getProjectActivity,
  getTestFileActivity,
  getLatestTestFiles,
};
