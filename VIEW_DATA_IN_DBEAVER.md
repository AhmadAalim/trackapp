# 📊 View Website Data in DBeaver

## Step 1: Create Database Tables (If Not Already Created)

### In DBeaver:

1. **Right-click your database** (`railway`) → **SQL Editor** → **New SQL Script**

2. **Copy and paste this SQL** (from `CREATE_SCHEMA_SQL.sql`):

```sql
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

-- Expenses table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
```

3. **Run the SQL** (F5 or Run button)

4. **Refresh** your database → You should see tables: `products`, `employees`, `suppliers`, `sales`, `sale_items`, `expenses`, `purchase_orders`

---

## Step 2: Verify Backend is Using PostgreSQL

Check Railway logs to confirm PostgreSQL connection:

```bash
cd server
npx @railway/cli logs --tail 50
```

Look for: "Connected to PostgreSQL" message

---

## Step 3: Add Data via Website

1. **Visit your website:**
   - https://trackapp-1e6b1.web.app

2. **Add some test data:**
   - Go to **Inventory** page
   - Click **"Add Product"**
   - Fill in product details
   - Save

3. **Or add via API:**
   ```bash
   curl -X POST https://trackapp-production.up.railway.app/api/inventory \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Product","price":10.99,"stock_quantity":100}'
   ```

---

## Step 4: View Data in DBeaver

1. **In DBeaver:**
   - Expand your database → **Schemas** → **public** → **Tables**

2. **Right-click `products` table** → **View Data** or **Open SQL Editor**

3. **Run query:**
   ```sql
   SELECT * FROM products;
   ```

4. **You should see your data!** ✅

---

## Quick Queries to Try:

```sql
-- View all products
SELECT * FROM products ORDER BY created_at DESC;

-- View all employees
SELECT * FROM employees;

-- View all sales
SELECT * FROM sales ORDER BY sale_date DESC;

-- Count products
SELECT COUNT(*) FROM products;

-- View products with low stock
SELECT * FROM products WHERE stock_quantity <= min_stock_level;
```

---

## ✅ Verification Checklist:

- [ ] Tables created in DBeaver
- [ ] Backend connected to PostgreSQL (check Railway logs)
- [ ] Added data via website
- [ ] Can see data in DBeaver

---

**If you don't see data:**
1. Check Railway logs for errors
2. Verify backend is using PostgreSQL (not SQLite)
3. Make sure you added data after connecting to PostgreSQL

