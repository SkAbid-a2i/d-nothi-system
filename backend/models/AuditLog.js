// models/AuditLog.js
const pool = require('../config/database');

class AuditLog {
  static async create(logData) {
    const {
      user_id,
      action_type,
      table_name,
      record_id,
      old_values,
      new_values,
      ip_address,
      user_agent
    } = logData;

    const [result] = await pool.execute(
      `INSERT INTO audit_logs 
       (user_id, action_type, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        action_type,
        table_name,
        record_id,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address,
        user_agent
      ]
    );
    return result.insertId;
  }

  static async findAll(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs al WHERE 1=1';
    const params = [];
    const countParams = [];

    // Apply filters
    if (filters.user_id) {
      query += ' AND al.user_id = ?';
      countQuery += ' AND al.user_id = ?';
      params.push(filters.user_id);
      countParams.push(filters.user_id);
    }

    if (filters.action_type) {
      query += ' AND al.action_type = ?';
      countQuery += ' AND al.action_type = ?';
      params.push(filters.action_type);
      countParams.push(filters.action_type);
    }

    if (filters.table_name) {
      query += ' AND al.table_name = ?';
      countQuery += ' AND al.table_name = ?';
      params.push(filters.table_name);
      countParams.push(filters.table_name);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND al.created_at BETWEEN ? AND ?';
      countQuery += ' AND al.created_at BETWEEN ? AND ?';
      params.push(filters.start_date, filters.end_date);
      countParams.push(filters.start_date, filters.end_date);
    }

    if (filters.search) {
      query += ' AND (u.name LIKE ? OR al.action_type LIKE ? OR al.table_name LIKE ?)';
      countQuery += ' AND (u.name LIKE ? OR al.action_type LIKE ? OR al.table_name LIKE ?)';
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [logs] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);
    const total = totalResult[0].total;

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async findById(id) {
    const [logs] = await pool.execute(
      `SELECT al.*, u.name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.id = ?`,
      [id]
    );
    return logs[0];
  }

  static async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [logs] = await pool.execute(
      `SELECT al.*, u.name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.user_id = ?
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );
    
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM audit_logs WHERE user_id = ?',
      [userId]
    );
    const total = totalResult[0].total;

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async deleteOldLogs(days = 90) {
    const deleteBefore = new Date();
    deleteBefore.setDate(deleteBefore.getDate() - days);
    
    const [result] = await pool.execute(
      'DELETE FROM audit_logs WHERE created_at < ?',
      [deleteBefore.toISOString().split('T')[0]]
    );
    
    return result.affectedRows;
  }
}

module.exports = AuditLog;