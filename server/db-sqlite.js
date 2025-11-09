// SQLite database adapter
// This file provides SQLite-specific implementations

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteDB {
  constructor() {
    this.db = null;
  }

  connect() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, 'store.db');
    this.db = new sqlite3.Database(dbPath);
    console.log('Connected to SQLite:', dbPath);
    return this.db;
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
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
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close(resolve);
    });
  }
}

module.exports = SQLiteDB;

