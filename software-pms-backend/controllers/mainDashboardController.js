const db = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    // Get active projects count and total projects
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
            SELECT COUNT(*) as total_files
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
      completedSprints: sprintStats[0].completed_sprints,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjectActivity = async (req, res) => {
  try {
    // Get monthly project activity based on action logs
    const [monthlyActivity] = await db.query(`
            SELECT 
                DATE_FORMAT(action_date, '%Y-%m') as month,
                COUNT(*) as activity
            FROM action_logs
            WHERE target_table = 'projects'
            AND action_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(action_date, '%Y-%m')
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

module.exports = {
  getDashboardStats,
  getProjectActivity,
};
