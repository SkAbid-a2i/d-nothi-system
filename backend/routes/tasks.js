// routes/tasks.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

const router = express.Router();

// Get all tasks with filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assigned_to,
      category_id,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT t.*, 
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

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM tasks t
      WHERE 1=1
    `;

    const params = [];
    const countParams = [];

    // Apply filters
    if (status) {
      query += ' AND t.status = ?';
      countQuery += ' AND t.status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (priority) {
      query += ' AND t.priority = ?';
      countQuery += ' AND t.priority = ?';
      params.push(priority);
      countParams.push(priority);
    }

    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      countQuery += ' AND t.assigned_to = ?';
      params.push(assigned_to);
      countParams.push(assigned_to);
    } else if (req.user.role === 'Agent') {
      // Agents can only see their own tasks
      query += ' AND t.assigned_to = ?';
      countQuery += ' AND t.assigned_to = ?';
      params.push(req.user.id);
      countParams.push(req.user.id);
    }

    if (category_id) {
      query += ' AND t.category_id = ?';
      countQuery += ' AND t.category_id = ?';
      params.push(category_id);
      countParams.push(category_id);
    }

    if (start_date && end_date) {
      query += ' AND t.due_date BETWEEN ? AND ?';
      countQuery += ' AND t.due_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
      countParams.push(start_date, end_date);
    }

    if (search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      countQuery += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [tasks] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);
    const total = totalResult[0].total;

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [tasks] = await pool.execute(
      `SELECT t.*, 
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
      WHERE t.id = ?`,
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to view this task
    if (req.user.role === 'Agent' && tasks[0].assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task: tasks[0] });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('assigned_to').isInt().withMessage('Valid assigned user is required'),
  body('due_date').isDate().withMessage('Valid due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      status = 'Pending',
      priority = 'Medium',
      due_date,
      assigned_to,
      category_id,
      service_id,
      office_id,
      source_id
    } = req.body;

    // Check if assigned user exists and is active
    const [users] = await pool.execute(
      'SELECT id, is_active FROM users WHERE id = ?',
      [assigned_to]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(400).json({ message: 'Invalid assigned user' });
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks 
       (title, description, status, priority, due_date, assigned_to, assigned_by, category_id, service_id, office_id, source_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, status, priority, due_date, assigned_to, req.user.id, category_id, service_id, office_id, source_id]
    );

    // Create audit log
    await createAuditLog(
      req.user.id,
      'tasks',
      'CREATE',
      result.insertId,
      null,
      req.body,
      req.ip,
      req.get('User-Agent')
    );

    res.status(201).json({ message: 'Task created successfully', taskId: result.insertId });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('Title cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      due_date,
      assigned_to,
      category_id,
      service_id,
      office_id,
      source_id
    } = req.body;

    // Check if task exists
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const oldTask = tasks[0];

    // Check permission
    if (req.user.role === 'Agent' && oldTask.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update task
    await pool.execute(
      `UPDATE tasks 
       SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, 
           assigned_to = ?, category_id = ?, service_id = ?, office_id = ?, source_id = ?
       WHERE id = ?`,
      [title, description, status, priority, due_date, assigned_to, 
       category_id, service_id, office_id, source_id, id]
    );

    // Create audit log
    await createAuditLog(
      req.user.id,
      'tasks',
      'UPDATE',
      id,
      oldTask,
      req.body,
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if task exists
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const oldTask = tasks[0];

    // Check permission - only admins and the assigner can delete
    if (req.user.role === 'Agent' && oldTask.assigned_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);

    // Create audit log
    await createAuditLog(
      req.user.id,
      'tasks',
      'DELETE',
      id,
      oldTask,
      null,
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.patch('/:id/status', [
  body('status').isIn(['Pending', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if task exists
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const oldTask = tasks[0];

    // Check permission - only assigned user or admin can update status
    if (req.user.role === 'Agent' && oldTask.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);

    // Create audit log
    await createAuditLog(
      req.user.id,
      'tasks',
      'UPDATE_STATUS',
      id,
      { oldStatus: oldTask.status },
      { newStatus: status },
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: 'Task status updated successfully' });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;