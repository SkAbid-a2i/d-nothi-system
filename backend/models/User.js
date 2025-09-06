// models/User.js
const pool = require('../config/database');

class User {
  static async findById(id) {
    const [users] = await pool.execute(
      'SELECT id, employee_id, name, email, role, department, designation, is_active FROM users WHERE id = ?',
      [id]
    );
    return users[0];
  }

  static async findByEmail(email) {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0];
  }

  static async create(userData) {
    const { employee_id, name, email, password, role, department, designation } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (employee_id, name, email, password, role, department, designation) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employee_id, name, email, password, role, department, designation]
    );
    return result.insertId;
  }

  static async update(id, userData) {
    const { name, email, department, designation } = userData;
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, department = ?, designation = ? WHERE id = ?',
      [name, email, department, designation, id]
    );
  }

  static async updateRole(id, role) {
    await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );
  }

  static async toggleActive(id, isActive) {
    await pool.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive, id]
    );
  }

  static async findAll(page = 1, limit = 10, search = '') {
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

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = User;