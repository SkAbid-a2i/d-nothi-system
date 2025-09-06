// models/Notification.js
const pool = require('../config/database');

class Notification {
  static async create(notificationData) {
    const {
      user_id,
      title,
      message,
      type = 'Info',
      related_id = null,
      related_type = null
    } = notificationData;

    const [result] = await pool.execute(
      `INSERT INTO notifications 
       (user_id, title, message, type, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, title, message, type, related_id, related_type]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );
    return notifications[0];
  }

  static async findByUserId(userId, page = 1, limit = 10, unreadOnly = false) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    const params = [userId];
    const countParams = [userId];

    if (unreadOnly) {
      query += ' AND is_read = FALSE';
      countQuery += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [notifications] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);
    const total = totalResult[0].total;

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async markAsRead(id) {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );
  }

  static async markAllAsRead(userId) {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
  }

  static async getUnreadCount(userId) {
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result[0].count;
  }

  static async delete(id) {
    await pool.execute(
      'DELETE FROM notifications WHERE id = ?',
      [id]
    );
  }

  static async deleteOldNotifications(days = 30) {
    const deleteBefore = new Date();
    deleteBefore.setDate(deleteBefore.getDate() - days);
    
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE created_at < ? AND is_read = TRUE',
      [deleteBefore.toISOString().split('T')[0]]
    );
    
    return result.affectedRows;
  }

  static async createForRole(role, notificationData) {
    const { title, message, type, related_id, related_type } = notificationData;
    
    // Get all users with the specified role
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE role = ? AND is_active = TRUE',
      [role]
    );

    const notifications = [];
    for (const user of users) {
      const notificationId = await this.create({
        user_id: user.id,
        title,
        message,
        type,
        related_id,
        related_type
      });
      notifications.push(notificationId);
    }

    return notifications;
  }
}

module.exports = Notification;