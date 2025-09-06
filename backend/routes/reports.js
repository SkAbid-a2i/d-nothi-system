// routes/reports.js
const express = require('express');
const pool = require('../config/database');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Generate task reports
router.get('/tasks', authorize('SystemAdmin', 'Admin', 'Supervisor'), async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      status,
      priority,
      assigned_to,
      category_id
    } = req.query;

    let query = `
      SELECT 
        t.*,
        u.name as assigned_to_name,
        u2.name as assigned_by_name,
        c.name as category_name,
        s.name as service_name,
        o.name as office_name,
        src.name as source_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN services s ON t.service_id = s.id
      LEFT JOIN offices o ON t.office_id = o.id
      LEFT JOIN sources src ON t.source_id = src.id
      WHERE 1=1
    `;

    const params = [];

    // Apply filters
    if (start_date && end_date) {
      query += ' AND t.due_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }

    if (category_id) {
      query += ' AND t.category_id = ?';
      params.push(category_id);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await pool.execute(query, params);

    // Generate summary statistics
    const summary = {
      total: tasks.length,
      byStatus: {},
      byPriority: {},
      byCategory: {}
    };

    tasks.forEach(task => {
      // Count by status
      summary.byStatus[task.status] = (summary.byStatus[task.status] || 0) + 1;
      
      // Count by priority
      summary.byPriority[task.priority] = (summary.byPriority[task.priority] || 0) + 1;
      
      // Count by category
      if (task.category_name) {
        summary.byCategory[task.category_name] = (summary.byCategory[task.category_name] || 0) + 1;
      }
    });

    res.json({
      tasks,
      summary,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generate task report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate leave reports
router.get('/leaves', authorize('SystemAdmin', 'Admin', 'Supervisor'), async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      status,
      leave_type_id,
      user_id
    } = req.query;

    let query = `
      SELECT 
        l.*,
        u.name as user_name,
        u2.name as approved_by_name,
        lt.name as leave_type_name
      FROM leaves l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users u2 ON l.approved_by = u2.id
      LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
      WHERE 1=1
    `;

    const params = [];

    // Apply filters
    if (start_date && end_date) {
      query += ' AND (l.start_date BETWEEN ? AND ? OR l.end_date BETWEEN ? AND ?)';
      params.push(start_date, end_date, start_date, end_date);
    }

    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }

    if (leave_type_id) {
      query += ' AND l.leave_type_id = ?';
      params.push(leave_type_id);
    }

    if (user_id) {
      query += ' AND l.user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY l.created_at DESC';

    const [leaves] = await pool.execute(query, params);

    // Generate summary statistics
    const summary = {
      total: leaves.length,
      byStatus: {},
      byLeaveType: {},
      byUser: {}
    };

    leaves.forEach(leave => {
      // Count by status
      summary.byStatus[leave.status] = (summary.byStatus[leave.status] || 0) + 1;
      
      // Count by leave type
      if (leave.leave_type_name) {
        summary.byLeaveType[leave.leave_type_name] = (summary.byLeaveType[leave.leave_type_name] || 0) + 1;
      }
      
      // Count by user
      if (leave.user_name) {
        summary.byUser[leave.user_name] = (summary.byUser[leave.user_name] || 0) + 1;
      }
    });

    res.json({
      leaves,
      summary,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generate leave report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;