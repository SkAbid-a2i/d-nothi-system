// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const [users] = await pool.execute(
      'SELECT id, employee_id, name, email, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ message: 'User not found or inactive.' });
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorize };