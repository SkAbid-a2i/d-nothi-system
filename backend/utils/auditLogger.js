// backend/utils/auditLogger.js
const pool = require('../config/database');

const createAuditLog = async (userId, tableName, actionType, recordId, oldValues, newValues, ipAddress, userAgent) => {
  try {
    await pool.execute(
      `INSERT INTO audit_logs 
       (user_id, table_name, action_type, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        tableName,
        actionType,
        recordId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

module.exports = { createAuditLog };