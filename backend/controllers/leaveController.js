// controllers/leaveController.js
const pool = require('../config/database');
const { createAuditLog } = require('../utils/auditLogger');

const getLeaves = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      user_id,
      leave_type_id,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT l.*, 
        u.name as user_name,
        u2.name as approved_by_name,
        lt.name as leave_type_name
      FROM leaves l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users u2 ON l.approved_by = u2.id
      LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
      WHERE 1=1
    `;

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM leaves l
      WHERE 1=1
    `;

    const params = [];
    const countParams = [];

    // Apply filters
    if (status) {
      query += ' AND l.status = ?';
      countQuery += ' AND l.status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (user_id) {
      query += ' AND l.user_id = ?';
      countQuery += ' AND l.user_id = ?';
      params.push(user_id);
      countParams.push(user_id);
    } else if (req.user.role === 'Agent') {
      // Agents can only see their own leaves
      query += ' AND l.user_id = ?';
      countQuery += ' AND l.user_id = ?';
      params.push(req.user.id);
      countParams.push(req.user.id);
    }

    if (leave_type_id) {
      query += ' AND l.leave_type_id = ?';
      countQuery += ' AND l.leave_type_id = ?';
      params.push(leave_type_id);
      countParams.push(leave_type_id);
    }

    if (start_date && end_date) {
      query += ' AND (l.start_date BETWEEN ? AND ? OR l.end_date BETWEEN ? AND ?)';
      countQuery += ' AND (l.start_date BETWEEN ? AND ? OR l.end_date BETWEEN ? AND ?)';
      params.push(start_date, end_date, start_date, end_date);
      countParams.push(start_date, end_date, start_date, end_date);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [leaves] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);
    const total = totalResult[0].total;

    res.json({
      leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [leaves] = await pool.execute(
      `SELECT l.*, 
        u.name as user_name,
        u2.name as approved_by_name,
        lt.name as leave_type_name
      FROM leaves l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users u2 ON l.approved_by = u2.id
      LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
      WHERE l.id = ?`,
      [id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Check if user has permission to view this leave
    if (req.user.role === 'Agent' && leaves[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ leave: leaves[0] });
  } catch (error) {
    console.error('Get leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createLeave = async (req, res) => {
  try {
    const {
      leave_type_id,
      start_date,
      end_date,
      reason
    } = req.body;

    // Check if dates are valid
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    if (start > end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Check if leave type exists
    const [leaveTypes] = await pool.execute(
      'SELECT id, max_days FROM leave_types WHERE id = ? AND is_active = TRUE',
      [leave_type_id]
    );

    if (leaveTypes.length === 0) {
      return res.status(400).json({ message: 'Invalid leave type' });
    }

    const [result] = await pool.execute(
      `INSERT INTO leaves 
       (user_id, leave_type_id, start_date, end_date, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, leave_type_id, start_date, end_date, reason]
    );

    // Create audit log
    await createAuditLog(
      req.user.id,
      'leaves',
      'CREATE',
      result.insertId,
      null,
      req.body,
      req.ip,
      req.get('User-Agent')
    );

    res.status(201).json({ message: 'Leave request submitted successfully', leaveId: result.insertId });
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    // Check if leave exists
    const [leaves] = await pool.execute('SELECT * FROM leaves WHERE id = ?', [id]);
    if (leaves.length === 0) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    const oldLeave = leaves[0];

    // Check if leave is already processed
    if (oldLeave.status !== 'Pending') {
      return res.status(400).json({ message: 'Leave request already processed' });
    }

    await pool.execute(
      'UPDATE leaves SET status = ?, approved_by = ?, comments = ? WHERE id = ?',
      [status, req.user.id, comments, id]
    );

    // Create audit log
    await createAuditLog(
      req.user.id,
      'leaves',
      'UPDATE_STATUS',
      id,
      { oldStatus: oldLeave.status },
      { newStatus: status, comments },
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: `Leave request ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeaveStatus
};