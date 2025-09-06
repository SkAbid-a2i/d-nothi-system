// controllers/adminController.js
const pool = require('../config/database');

const getStatistics = async (req, res) => {
  try {
    // Get user statistics
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN role = 'SystemAdmin' THEN 1 ELSE 0 END) as system_admins,
        SUM(CASE WHEN role = 'Admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'Supervisor' THEN 1 ELSE 0 END) as supervisors,
        SUM(CASE WHEN role = 'Agent' THEN 1 ELSE 0 END) as agents
      FROM users
    `);

    // Get task statistics
    const [taskStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_tasks,
        SUM(CASE WHEN priority = 'High' OR priority = 'Urgent' THEN 1 ELSE 0 END) as high_priority_tasks
      FROM tasks
    `);

    // Get leave statistics
    const [leaveStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_leaves,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_leaves,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_leaves,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_leaves
      FROM leaves
    `);

    // Get recent activities
    const [recentActivities] = await pool.execute(`
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    res.json({
      userStats: userStats[0],
      taskStats: taskStats[0],
      leaveStats: leaveStats[0],
      recentActivities
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStatistics
};