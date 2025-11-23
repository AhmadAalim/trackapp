/**
 * Database initialization script
 * Creates all necessary tables in the database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'store.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database:', dbPath);
  console.log('🔄 Initializing database tables...\n');
});

// Initialize database tables
db.serialize(() => {
  // Products/Inventory table
  db.run(`CREATE TABLE IF NOT EXISTS products (
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating products table:', err);
    else console.log('✅ Created products table');
  });

  // Employees table
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    position TEXT,
    salary REAL,
    hire_date TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating employees table:', err);
    else console.log('✅ Created employees table');
  });

  // Suppliers table
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating suppliers table:', err);
    else console.log('✅ Created suppliers table');
  });

  // Sales table
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL NOT NULL,
    payment_method TEXT,
    employee_id INTEGER,
    notes TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )`, (err) => {
    if (err) console.error('Error creating sales table:', err);
    else console.log('✅ Created sales table');
  });

  // Sale items table
  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`, (err) => {
    if (err) console.error('Error creating sale_items table:', err);
    else console.log('✅ Created sale_items table');
  });

  // Expenses table (now includes income/expense types)
  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT 'expense',
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    expense_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    employee_id INTEGER,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )`, (err) => {
    if (err) console.error('Error creating expenses table:', err);
    else console.log('✅ Created expenses table');
  });
  
  // Add type column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT 'expense'`, (err) => {
    // Ignore error if column already exists
  });

  db.run(`ALTER TABLE expenses ADD COLUMN employee_id INTEGER`, (err) => {
    // Ignore error if column already exists
  });

  // Purchase orders table
  db.run(`CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    order_date TEXT,
    total_amount REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating purchase_orders table:', err);
    } else {
      console.log('✅ Created purchase_orders table');
    }
  });

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    delivery_address TEXT,
    total_amount REAL NOT NULL,
    payment_method TEXT,
    notes TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'instagram', 'whatsapp', 'website')),
    employee_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating orders table:', err);
    } else {
      console.log('✅ Created orders table');
    }
  });

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating order_items table:', err);
    } else {
      console.log('✅ Created order_items table');
    }
  });

  // Clients table
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    balance REAL DEFAULT 0 NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating clients table:', err);
    } else {
      console.log('✅ Created clients table');
    }
  });

  // Client transactions table
  db.run(`CREATE TABLE IF NOT EXISTS client_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    related_order_id INTEGER,
    related_sale_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (related_order_id) REFERENCES orders(id),
    FOREIGN KEY (related_sale_id) REFERENCES sales(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating client_transactions table:', err);
    } else {
      console.log('✅ Created client_transactions table');
    }
    
    // Wait a bit for all operations to complete
    setTimeout(() => {
      console.log('\n✨ Database initialization complete!');
      console.log('📊 All tables are ready to use.\n');
      
      // Verify tables were created
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
          console.error('Error checking tables:', err);
        } else {
          console.log(`📋 Created ${rows.length} tables:`);
          rows.forEach(row => {
            console.log(`   - ${row.name}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          }
          process.exit(0);
        });
      });
    }, 500);
  });
});

