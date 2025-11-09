// PostgreSQL database adapter
// This file provides PostgreSQL-specific implementations

const { Pool } = require('pg');

class PostgresDB {
  constructor() {
    this.pool = null;
  }

  connect() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    console.log('Connected to PostgreSQL:', process.env.DB_NAME);
    return this.pool;
  }

  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return {
        rows: result.rows,
        changes: result.rowCount,
        lastID: result.rows[0]?.id || null
      };
    } catch (error) {
      console.error('PostgreSQL query error:', error);
      throw error;
    }
  }

  async run(sql, params = []) {
    return this.query(sql, params);
  }

  async all(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows;
  }

  async get(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows[0] || null;
  }

  close() {
    return this.pool.end();
  }
}

module.exports = PostgresDB;

