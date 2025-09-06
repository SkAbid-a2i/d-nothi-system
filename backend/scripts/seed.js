// scripts/seed.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seed = async () => {
  let connection;
  try {
    // Create connection to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: true
      }
    });

    console.log('Connected to TiDB database');

    // Read and execute seeds.sql
    const fs = require('fs');
    const path = require('path');
    const seedsPath = path.join(__dirname, '../database/seeds.sql');
    const seedsSQL = fs.readFileSync(seedsPath, 'utf8');

    // Split SQL statements and execute them
    const statements = seedsSQL.split(';').filter(stmt => stmt.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        await connection.execute(stmt + ';');
        console.log('Executed SQL statement');
      }
    }

    // Hash passwords for sample users
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);
    
    await connection.execute(
      'UPDATE users SET password = ? WHERE email LIKE ?',
      [hashedPassword, '%@dnothi.com']
    );

    console.log('Database seeding completed successfully');
    console.log('Sample users created with password: password123');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

seed();