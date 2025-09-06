// routes/migrate.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const router = express.Router();

router.post('/migrate', async (req, res) => {
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split and execute statements
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        await pool.execute(stmt + ';');
      }
    }

    res.json({ message: 'Database migrated successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: 'Migration failed', error: error.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    // Read seed file
    const seedPath = path.join(__dirname, '../database/seeds.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    // Split and execute statements
    const statements = seedSQL.split(';').filter(stmt => stmt.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        await pool.execute(stmt + ';');
      }
    }

    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
});

module.exports = router;