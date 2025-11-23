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

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  delivery_address TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'instagram', 'whatsapp', 'website')),
  employee_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client transactions table (for tracking balance changes)
CREATE TABLE IF NOT EXISTS client_transactions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('charge', 'payment')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  related_order_id INTEGER,
  related_sale_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (related_order_id) REFERENCES orders(id),
  FOREIGN KEY (related_sale_id) REFERENCES sales(id)
);

-- Create indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_client_transactions_client_id ON client_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_transactions_date ON client_transactions(created_at);

