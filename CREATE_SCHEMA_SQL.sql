-- PostgreSQL Schema for TrackApp
-- Copy and paste this into DBeaver SQL Editor and run it

-- Products/Inventory table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  category TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  supplier_id INTEGER,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  position TEXT,
  salary DECIMAL(10, 2),
  hire_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  employee_id INTEGER,
  notes TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Expenses table (includes income/expense types)
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'expense',
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  expense_date DATE,
  employee_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL,
  order_date DATE,
  total_amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);

