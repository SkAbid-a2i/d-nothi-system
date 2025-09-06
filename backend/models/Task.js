// models/Task.js
const pool = require('../config/database');

class Task {
  static async create(taskData) {
    const {
      title,
      description,
      status = 'Pending',
      priority = 'Medium',
      due_date,
      assigned_to,
      assigned_by,
      category_id = null,
      service_id = null,
      office_id = null,
      source_id = null
    } = taskData;

    const [result] = await pool.execute(
      `INSERT INTO tasks 
       (title, description, status, priority, due_date, assigned_to, assigned_by, category_id, service_id, office_id, source_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, status, priority, due_date, assigned_to, assigned_by, category_id, service_id, office_id, source_id]
    );
    return result.insertId;
  }

  static async findById(id) {
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
    return tasks[0];
  }

  static async findAll(page = 1, limit = 10, filters = {}) {
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
    let countQuery = 'SELECT COUNT(*) as total FROM tasks t WHERE 1=1';
    const params = [];
    const countParams = [];

    // Apply filters
    if (filters.assigned_to) {
      query += ' AND t.assigned_to = ?';
      countQuery += ' AND t.assigned_to = ?';
      params.push(filters.assigned_to);
      countParams.push(filters.assigned_to);
    }

    if (filters.status) {
      query += ' AND t.status = ?';
      countQuery += ' AND t.status = ?';
      params.push(filters.status);
      countParams.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND t.priority = ?';
      countQuery += ' AND t.priority = ?';
      params.push(filters.priority);
      countParams.push(filters.priority);
    }

    if (filters.category_id) {
      query += ' AND t.category_id = ?';
      countQuery += ' AND t.category_id = ?';
      params.push(filters.category_id);
      countParams.push(filters.category_id);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND t.due_date BETWEEN ? AND ?';
      countQuery += ' AND t.due_date BETWEEN ? AND ?';
      params.push(filters.start_date, filters.end_date);
      countParams.push(filters.start_date, filters.end_date);
    }

    if (filters.search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      countQuery += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [tasks] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);
    const total = totalResult[0].total;

    return {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async update(id, taskData) {
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
    } = taskData;

    await pool.execute(
      `UPDATE tasks 
       SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, 
           assigned_to = ?, category_id = ?, service_id = ?, office_id = ?, source_id = ?
       WHERE id = ?`,
      [title, description, status, priority, due_date, assigned_to, 
       category_id, service_id, office_id, source_id, id]
    );
  }

  static async updateStatus(id, status) {
    await pool.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  static async delete(id) {
    await pool.execute(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );
  }

  static async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [tasks] = await pool.execute(
      `SELECT t.*, 
        u.name as assigned_to_name,
        u2.name as assigned_by_name,
        c.name as category_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.assigned_to = ?
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );
    
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM tasks WHERE assigned_to = ?',
      [userId]
    );
    const total = totalResult[0].total;

    return {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getTaskStats(userId = null) {
    let query = `
      SELECT 
        status,
        priority,
        COUNT(*) as count
      FROM tasks
    `;
    const params = [];

    if (userId) {
      query += ' WHERE assigned_to = ?';
      params.push(userId);
    }

    query += ' GROUP BY status, priority';

    const [stats] = await pool.execute(query, params);
    
    const result = {
      total: 0,
      byStatus: {},
      byPriority: {}
    };

    stats.forEach(stat => {
      result.byStatus[stat.status] = (result.byStatus[stat.status] || 0) + stat.count;
      result.byPriority[stat.priority] = (result.byPriority[stat.priority] || 0) + stat.count;
      result.total += stat.count;
    });

    return result;
  }

  static async getOverdueTasks() {
    const [tasks] = await pool.execute(
      `SELECT t.*, u.name as assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.due_date < CURDATE() 
       AND t.status NOT IN ('Completed', 'Cancelled')
       ORDER BY t.due_date ASC`
    );
    return tasks;
  }

  static async getUpcomingTasks(days = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const [tasks] = await pool.execute(
      `SELECT t.*, u.name as assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.due_date BETWEEN ? AND ?
       AND t.status NOT IN ('Completed', 'Cancelled')
       ORDER BY t.due_date ASC`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );
    return tasks;
  }
}

module.exports = Task;