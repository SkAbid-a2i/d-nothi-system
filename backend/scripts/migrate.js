// scripts/migrate.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const migrate = async () => {
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

    // Read and execute schema.sql
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL statements and execute them
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        await connection.execute(stmt + ';');
        console.log('Executed SQL statement');
      }
    }

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

migrate();