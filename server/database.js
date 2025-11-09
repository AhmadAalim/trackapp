// Unified database interface
// Supports both SQLite and PostgreSQL

const SQLiteDB = require('./db-sqlite');
const PostgresDB = require('./db-postgres');

class Database {
  constructor() {
    this.db = null;
    this.type = process.env.DB_TYPE || 'sqlite';
  }

  connect() {
    if (this.type === 'postgres') {
      this.db = new PostgresDB();
    } else {
      this.db = new SQLiteDB();
    }
    return this.db.connect();
  }

  async query(sql, params = []) {
    return this.db.query(sql, params);
  }

  async run(sql, params = []) {
    return this.db.run(sql, params);
  }

  async all(sql, params = []) {
    return this.db.all(sql, params);
  }

  async get(sql, params = []) {
    return this.db.get(sql, params);
  }

  close() {
    return this.db.close();
  }

  getDB() {
    return this.db;
  }
}

module.exports = new Database();

