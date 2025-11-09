const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection handler
class Database {
  constructor() {
    this.db = null;
    this.type = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'postgres'
  }

  connect() {
    if (this.type === 'postgres') {
      // PostgreSQL connection will be handled by pg library
      return this.connectPostgres();
    } else {
      // SQLite connection (default)
      return this.connectSQLite();
    }
  }

  connectSQLite() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, 'store.db');
    this.db = new sqlite3.Database(dbPath);
    console.log('Connected to SQLite database:', dbPath);
    return this.db;
  }

  connectPostgres() {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    this.db = pool;
    console.log('Connected to PostgreSQL database:', process.env.DB_NAME);
    return pool;
  }

  // Unified query method
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (this.type === 'postgres') {
        this.db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve({ rows: result.rows, changes: result.rowCount });
        });
      } else {
        // SQLite
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          this.db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows, changes: 0 });
          });
        } else {
          this.db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ rows: [], changes: this.changes, lastID: this.lastID });
          });
        }
      }
    });
  }

  // Get database instance
  getDB() {
    return this.db;
  }

  // Close connection
  close() {
    if (this.type === 'postgres') {
      return this.db.end();
    } else {
      return new Promise((resolve) => {
        this.db.close(resolve);
      });
    }
  }
}

module.exports = new Database();

