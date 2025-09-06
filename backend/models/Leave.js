// models/Leave.js
const pool = require('../config/database');

class Leave {
  static async create(leaveData) {
    const {
      user_id,
      leave_type_id,
      start_date,
      end_date,
      reason
    } = leaveData;

    const [result] = await pool.execute(
      `INSERT INTO leaves 
       (user_id, leave_type_id, start_date, end_date, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, leave_type_id, start_date, end_date, reason]
    );
    return result.insertId;
  }

  static async findById(id) {
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
    return leaves[0];
  }

  static async findAll(page = 1, limit = 10, filters = {}) {
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
    let countQuery = 'SELECT COUNT(*) as total FROM leaves l WHERE 1=1';
    const params = [];
    const countParams = [];

    // Apply filters
    if (filters.user_id) {
      query += ' AND l.user_id = ?';
      countQuery += ' AND l.user_id = ?';
      params.push(filters.user_id);
      countParams.push(filters.user_id);
    }

    if (filters.status) {
      query += ' AND l.status = ?';
      countQuery += ' AND l.status = ?';
      params.push(filters.status);
      countParams.push(filters.status);
    }

    if (filters.leave_type_id) {
      query += ' AND l.leave_type_id = ?';
      countQuery += ' AND l.leave_type_id = ?';
      params.push(filters.leave_type_id);
      countParams.push(filters.leave_type_id);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND (l.start_date BETWEEN ? AND ? OR l.end_date BETWEEN ? AND ?)';
      countQuery += ' AND (l.start_date BETWEEN ? AND ? OR l.end_date BETWEEN ? AND ?)';
      params.push(filters.start_date, filters.end_date, filters.start_date, filters.end_date);
      countParams.push(filters.start_date, filters.end_date, filters.start_date, filters.end_date);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [leaves] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);
    const total = totalResult[0].total;

    return {
      leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async updateStatus(id, status, approved_by, comments = null) {
    await pool.execute(
      'UPDATE leaves SET status = ?, approved_by = ?, comments = ? WHERE id = ?',
      [status, approved_by, comments, id]
    );
  }

  static async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [leaves] = await pool.execute(
      `SELECT l.*, lt.name as leave_type_name
       FROM leaves l
       LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
       WHERE l.user_id = ?
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );
    
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM leaves WHERE user_id = ?',
      [userId]
    );
    const total = totalResult[0].total;

    return {
      leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getLeaveStats(userId = null) {
    let query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM leaves
    `;
    const params = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += ' GROUP BY status';

    const [stats] = await pool.execute(query, params);
    
    const result = {
      total: 0,
      byStatus: {}
    };

    stats.forEach(stat => {
      result.byStatus[stat.status] = stat.count;
      result.total += stat.count;
    });

    return result;
  }

  static async checkLeaveOverlap(userId, startDate, endDate, excludeId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM leaves
      WHERE user_id = ?
      AND status != 'Rejected'
      AND (
        (start_date BETWEEN ? AND ?) OR
        (end_date BETWEEN ? AND ?) OR
        (start_date <= ? AND end_date >= ?)
      )
    `;
    const params = [userId, startDate, endDate, startDate, endDate, startDate, endDate];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [result] = await pool.execute(query, params);
    return result[0].count > 0;
  }
}

module.exports = Leave;