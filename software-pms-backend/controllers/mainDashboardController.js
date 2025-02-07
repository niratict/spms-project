const db = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    // Get active and total projects
    const [projectStats] = await db.query(`
            SELECT 
                COUNT(*) as total_projects,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_projects
            FROM projects
        `);

    // Get total users count
    const [userStats] = await db.query(`
            SELECT COUNT(*) as total_users
            FROM users
        `);

    // Get total test files
    const [fileStats] = await db.query(`
            SELECT 
                COUNT(*) as total_files,
                COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed_files,
                COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed_files
            FROM test_files
            WHERE status != 'Deleted'
        `);

    // Get completed sprints count
    const [sprintStats] = await db.query(`
            SELECT COUNT(*) as completed_sprints
            FROM sprints
            WHERE end_date < CURRENT_DATE()
        `);

    res.json({
      activeProjects: projectStats[0].active_projects,
      totalProjects: projectStats[0].total_projects,
      totalUsers: userStats[0].total_users,
      totalFiles: fileStats[0].total_files,
      passedFiles: fileStats[0].passed_files,
      failedFiles: fileStats[0].failed_files,
      completedSprints: sprintStats[0].completed_sprints,
    });
  } catch (error) {
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

const getTestFileActivity = async (req, res) => {
  try {
    // Get monthly test file activity
    const [monthlyActivity] = await db.query(`
            SELECT 
                DATE_FORMAT(upload_date, '%Y-%m') as month,
                COUNT(*) as total_files,
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
};
