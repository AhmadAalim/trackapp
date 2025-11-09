// Database compatibility wrapper
// Provides callback-based API for existing routes while supporting both SQLite and PostgreSQL

const Database = require('./database');

class CompatibleDB {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      const dbInstance = require('./database');
      await dbInstance.connect();
      this.db = dbInstance;
      this.initialized = true;
      
      // Initialize schema
      await this.initSchema();
    }
    return this.db;
  }

  async initSchema() {
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    if (dbType === 'postgres') {
      // PostgreSQL schema is created via migration script
      // Just verify connection
      try {
        await this.db.query('SELECT 1');
      } catch (err) {
        console.error('PostgreSQL connection error:', err);
      }
    } else {
      // SQLite schema initialization (existing code)
      const sqliteDB = this.db.getDB();
      if (sqliteDB && sqliteDB.serialize) {
        sqliteDB.serialize(() => {
          // Products table
          sqliteDB.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            sku TEXT UNIQUE,
            category TEXT,
            price REAL NOT NULL,
            cost REAL,
            stock_quantity INTEGER DEFAULT 0,
            min_stock_level INTEGER DEFAULT 10,
            supplier_id INTEGER,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
          
          sqliteDB.run(`ALTER TABLE products ADD COLUMN image_url TEXT`, (err) => {});
          
          // Employees table
          sqliteDB.run(`CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            position TEXT,
            salary REAL,
            hire_date TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
          
          // Suppliers table
          sqliteDB.run(`CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
          
          // Sales table
          sqliteDB.run(`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_amount REAL NOT NULL,
            payment_method TEXT,
            employee_id INTEGER,
            notes TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
          )`);
          
          // Sale items table
          sqliteDB.run(`CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
          )`);
          
          // Expenses table
          sqliteDB.run(`CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL DEFAULT 'expense',
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            expense_date TEXT,
            employee_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
          )`);
          
          sqliteDB.run(`ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT 'expense'`, (err) => {});
          sqliteDB.run(`ALTER TABLE expenses ADD COLUMN employee_id INTEGER`, (err) => {});
          
          // Purchase orders table
          sqliteDB.run(`CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER NOT NULL,
            order_date TEXT,
            total_amount REAL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
          )`);
        });
      }
    }
  }

  // Callback-based API for compatibility
  all(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    this.init().then(() => {
      this.db.all(sql, params).then(result => {
        callback(null, result);
      }).catch(err => {
        callback(err);
      });
    }).catch(err => {
      callback(err);
    });
  }

  get(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    this.init().then(() => {
      this.db.get(sql, params).then(result => {
        callback(null, result);
      }).catch(err => {
        callback(err);
      });
    }).catch(err => {
      callback(err);
    });
  }

  run(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    this.init().then(() => {
      this.db.run(sql, params).then(result => {
        if (callback) {
          // SQLite-style callback with this context
          const mockThis = {
            lastID: result.lastID || null,
            changes: result.changes || 0
          };
          callback.call(mockThis, null);
        }
      }).catch(err => {
        if (callback) callback(err);
      });
    }).catch(err => {
      if (callback) callback(err);
    });
  }

  serialize(callback) {
    // Only for SQLite compatibility
    if (process.env.DB_TYPE === 'postgres') {
      // PostgreSQL doesn't need serialize, just run the callback
      this.init().then(() => {
        if (callback) callback();
      });
    } else {
      this.init().then(() => {
        const sqliteDB = this.db.getDB();
        if (sqliteDB && sqliteDB.serialize) {
          sqliteDB.serialize(callback);
        } else {
          if (callback) callback();
        }
      });
    }
  }
}

module.exports = new CompatibleDB();

