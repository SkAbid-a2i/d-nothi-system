// routes/dropdowns.js
const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY name'
    );
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get services by category
router.get('/services', async (req, res) => {
  try {
    const { category_id } = req.query;
    let query = 'SELECT * FROM services WHERE is_active = TRUE';
    const params = [];

    if (category_id) {
      query += ' AND category_id = ?';
      params.push(category_id);
    }

    query += ' ORDER BY name';

    const [services] = await pool.execute(query, params);
    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all offices
router.get('/offices', async (req, res) => {
  try {
    const [offices] = await pool.execute(
      'SELECT * FROM offices WHERE is_active = TRUE ORDER BY name'
    );
    res.json({ offices });
  } catch (error) {
    console.error('Get offices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sources
router.get('/sources', async (req, res) => {
  try {
    const [sources] = await pool.execute(
      'SELECT * FROM sources WHERE is_active = TRUE ORDER BY name'
    );
    res.json({ sources });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all leave types
router.get('/leave-types', async (req, res) => {
  try {
    const [leaveTypes] = await pool.execute(
      'SELECT * FROM leave_types WHERE is_active = TRUE ORDER BY name'
    );
    res.json({ leaveTypes });
  } catch (error) {
    console.error('Get leave types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;