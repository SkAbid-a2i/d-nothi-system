// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { createAuditLog } = require('../utils/auditLogger');
const { registerValidation, loginValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { employee_id, name, email, password, role = 'Agent', department, designation } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR employee_id = ?',
      [email, employee_id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email or employee ID' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (employee_id, name, email, password, role, department, designation) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employee_id, name, email, hashedPassword, role, department, designation]
    );

    // Create audit log
    await createAuditLog(result.insertId, 'users', 'CREATE', null, req.body, req.ip, req.get('User-Agent'));

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, employee_id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await pool.execute(
      'SELECT id, employee_id, name, email, role, department, designation, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;