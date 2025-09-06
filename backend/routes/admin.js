// routes/admin.js
const express = require('express');
const pool = require('../config/database');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Get system statistics
router.get('/statistics', authorize('SystemAdmin', 'Admin'), async (req, res) => {
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
});

// Get audit logs
router.get('/audit-logs', authorize('SystemAdmin', 'Admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      action_type,
      table_name,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs al
      WHERE 1=1
    `;

    const params = [];
    const countParams = [];

    // Apply filters
    if (user_id) {
      query += ' AND al.user_id = ?';
      countQuery += ' AND al.user_id = ?';
      params.push(user_id);
      countParams.push(user_id);
    }

    if (action_type) {
      query += ' AND al.action_type = ?';
      countQuery += ' AND al.action_type = ?';
      params.push(action_type);
      countParams.push(action_type);
    }

    if (table_name) {
      query += ' AND al.table_name = ?';
      countQuery += ' AND al.table_name = ?';
      params.push(table_name);
      countParams.push(table_name);
    }

    if (start_date && end_date) {
      query += ' AND al.created_at BETWEEN ? AND ?';
      countQuery += ' AND al.created_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
      countParams.push(start_date, end_date);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [auditLogs] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);
    const total = totalResult[0].total;

    res.json({
      auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;