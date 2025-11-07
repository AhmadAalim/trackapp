/**
 * Database Migration Script
 * Updates schema to match requirements for Naaman & Vardinon store management
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../store.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Starting database schema migration...\n');

db.serialize(() => {
  // 1. Update products table - add barcode column, rename fields
  db.run(`ALTER TABLE products ADD COLUMN barcode TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding barcode column:', err.message);
    } else {
      console.log('✅ Added barcode column to products');
    }
  });

  // Copy description to barcode if barcode is empty
  db.run(`UPDATE products SET barcode = description WHERE barcode IS NULL OR barcode = ''`, (err) => {
    if (err) console.error('Error migrating barcode data:', err.message);
    else console.log('✅ Migrated barcode data from description');
  });

  // Add selling_price and cost_price aliases (keep price and cost for compatibility)
  db.run(`ALTER TABLE products ADD COLUMN selling_price REAL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding selling_price column:', err.message);
    } else {
      console.log('✅ Added selling_price column');
      // Copy price to selling_price
      db.run(`UPDATE products SET selling_price = price WHERE selling_price IS NULL`);
    }
  });

  db.run(`ALTER TABLE products ADD COLUMN cost_price REAL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding cost_price column:', err.message);
    } else {
      console.log('✅ Added cost_price column');
      // Copy cost to cost_price
      db.run(`UPDATE products SET cost_price = cost WHERE cost_price IS NULL`);
    }
  });

  // Add quantity alias (keep stock_quantity for compatibility)
  db.run(`ALTER TABLE products ADD COLUMN quantity INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding quantity column:', err.message);
    } else {
      console.log('✅ Added quantity column');
      // Copy stock_quantity to quantity
      db.run(`UPDATE products SET quantity = stock_quantity WHERE quantity IS NULL`);
    }
  });

  db.run(`ALTER TABLE products ADD COLUMN min_quantity INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding min_quantity column:', err.message);
    } else {
      console.log('✅ Added min_quantity column');
      // Copy min_stock_level to min_quantity
      db.run(`UPDATE products SET min_quantity = min_stock_level WHERE min_quantity IS NULL`);
    }
  });

  // 2. Update employees table - add authentication fields
  db.run(`ALTER TABLE employees ADD COLUMN username TEXT UNIQUE`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding username column:', err.message);
    } else {
      console.log('✅ Added username column to employees');
    }
  });

  db.run(`ALTER TABLE employees ADD COLUMN password TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding password column:', err.message);
    } else {
      console.log('✅ Added password column to employees');
    }
  });

  db.run(`ALTER TABLE employees ADD COLUMN role TEXT DEFAULT 'employee'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding role column:', err.message);
    } else {
      console.log('✅ Added role column to employees');
      // Set existing employees to 'employee' role if not set
      db.run(`UPDATE employees SET role = 'employee' WHERE role IS NULL OR role = ''`);
    }
  });

  db.run(`ALTER TABLE expenses ADD COLUMN employee_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding employee_id column to expenses:', err.message);
    } else if (!err) {
      console.log('✅ Added employee_id column to expenses');
    }
  });

  // Create default manager account if no manager exists
  db.get(`SELECT COUNT(*) as count FROM employees WHERE role = 'manager'`, (err, row) => {
    if (!err && row.count === 0) {
      const defaultPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        `INSERT INTO employees (name, username, password, role, email, position, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Manager', 'admin', defaultPassword, 'manager', 'manager@store.com', 'Manager', 'active'],
        function(err) {
          if (err) {
            console.error('Error creating default manager:', err.message);
          } else {
            console.log('✅ Created default manager account (username: admin, password: admin123)');
          }
        }
      );
    }
  });

  // 3. Update sales table - add discount_given and items_sold JSON
  db.run(`ALTER TABLE sales ADD COLUMN discount_given REAL DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding discount_given column:', err.message);
    } else {
      console.log('✅ Added discount_given column to sales');
    }
  });

  db.run(`ALTER TABLE sales ADD COLUMN items_sold TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding items_sold column:', err.message);
    } else {
      console.log('✅ Added items_sold column to sales');
    }
  });

  // Migrate existing sale items to JSON format
  db.all(`SELECT sale_id, GROUP_CONCAT(
    json_object(
      'product_id', product_id,
      'quantity', quantity,
      'unit_price', unit_price,
      'total_price', total_price
    )
  ) as items FROM sale_items GROUP BY sale_id`, (err, rows) => {
    if (!err && rows) {
      rows.forEach(row => {
        if (row.items) {
          const itemsArray = row.items.split(',').map(item => JSON.parse(item));
          db.run(`UPDATE sales SET items_sold = ? WHERE id = ?`, 
            [JSON.stringify(itemsArray), row.sale_id]);
        }
      });
      console.log('✅ Migrated existing sale items to JSON format');
    }
  });

  // Rename sale_date to date_time for consistency
  db.run(`ALTER TABLE sales ADD COLUMN date_time DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding date_time column:', err.message);
    } else {
      console.log('✅ Added date_time column to sales');
      // Copy sale_date to date_time
      db.run(`UPDATE sales SET date_time = sale_date WHERE date_time IS NULL`);
    }
  });

  // Rename payment_method to payment_type for consistency
  db.run(`ALTER TABLE sales ADD COLUMN payment_type TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding payment_type column:', err.message);
    } else {
      console.log('✅ Added payment_type column to sales');
      // Copy payment_method to payment_type
      db.run(`UPDATE sales SET payment_type = payment_method WHERE payment_type IS NULL`);
    }
  });

  // 4. Create discount_rules table
  db.run(`CREATE TABLE IF NOT EXISTS discount_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    max_discount_percent REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('Error creating discount_rules table:', err.message);
    } else {
      console.log('✅ Created discount_rules table');
    }
  });

  // 5. Create indexes for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`, (err) => {
    if (!err) console.log('✅ Created index on products.barcode');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`, (err) => {
    if (!err) console.log('✅ Created index on products.category');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_sales_date_time ON sales(date_time)`, (err) => {
    if (!err) console.log('✅ Created index on sales.date_time');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username)`, (err) => {
    if (!err) console.log('✅ Created index on employees.username');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_discount_rules_product ON discount_rules(product_id)`, (err) => {
    if (!err) console.log('✅ Created index on discount_rules.product_id');
  });

  // Close database after all operations
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('\n✅ Database migration completed successfully!');
        console.log('\n📝 Default Manager Credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('   ⚠️  Please change this password after first login!\n');
      }
    });
  }, 2000);
});

