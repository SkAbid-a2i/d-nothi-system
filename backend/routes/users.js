// routes/users.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authorize('SystemAdmin', 'Admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, employee_id, name, email, role, department, designation, is_active, created_at
      FROM users WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR employee_id LIKE ?)';
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR employee_id LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);
    const total = totalResult[0].total;

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.execute(
      `SELECT id, employee_id, name, email, role, department, designation, is_active, created_at 
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, department, designation } = req.body;

    // Check if user exists
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldUser = users[0];

    // Update user
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, department = ?, designation = ? WHERE id = ?',
      [name, email, department, designation, id]
    );

    // Create audit log
    await createAuditLog(
      req.user.id,
      'users',
      'UPDATE',
      id,
      oldUser,
      { name, email, department, designation },
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (Admin only)
router.patch('/:id/role', authorize('SystemAdmin', 'Admin'), [
  body('role').isIn(['SystemAdmin', 'Admin', 'Supervisor', 'Agent']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Cannot change SystemAdmin role unless you're SystemAdmin
    if (req.user.role !== 'SystemAdmin') {
      const [currentUser] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
      if (currentUser.length > 0 && currentUser[0].role === 'SystemAdmin') {
        return res.status(403).json({ message: 'Only SystemAdmin can modify other SystemAdmin roles' });
      }
    }

    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    // Create audit log
    await createAuditLog(
      req.user.id,
      'users',
      'UPDATE_ROLE',
      id,
      { oldRole: req.body.oldRole },
      { newRole: role },
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user active status (Admin only)
router.patch('/:id/active', authorize('SystemAdmin', 'Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Cannot deactivate yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);

    // Create audit log
    await createAuditLog(
      req.user.id,
      'users',
      'UPDATE_STATUS',
      id,
      { oldStatus: !is_active },
      { newStatus: is_active },
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: `User ${is_active ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Toggle active status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;