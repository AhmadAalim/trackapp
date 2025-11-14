# 📊 View All Data in DBeaver - Complete Guide

## Step 1: Create All Tables in PostgreSQL

### In DBeaver:

1. **Right-click your database** (`railway`) → **SQL Editor** → **New SQL Script**

2. **Open:** `CREATE_SCHEMA_SQL.sql` (in your project root)

3. **Copy ALL the SQL** and paste into DBeaver

4. **Run it** (F5 or Run button)

5. **Refresh** database → You should see 7 tables:
   - `products` (inventory/items)
   - `employees`
   - `suppliers`
   - `sales`
   - `sale_items`
   - `expenses`
   - `purchase_orders`

---

## Step 2: Migrate Existing Data (If You Have Data in SQLite)

If you had data before switching to PostgreSQL:

```bash
cd server
export DB_HOST=postgres.railway.internal
export DB_PORT=5432
export DB_NAME=railway
export DB_USER=postgres
export DB_PASSWORD=FkTqqXqZipmZUVmhnsAfqRSzVtQammVy
export DB_SSL=false
export DB_TYPE=postgres

node migrations/migrate-sqlite-to-postgres.js
```

This will copy all your existing data from SQLite to PostgreSQL.

---

## Step 3: View All Data in DBeaver

### Quick View (Right-Click Method):

1. **Expand:** `railway` → `Schemas` → `public` → `Tables`
2. **Right-click any table** → **View Data**
3. See all rows! ✅

### SQL Queries (Better for Filtering):

**View All Products/Inventory:**
```sql
SELECT * FROM products ORDER BY created_at DESC;
```

**View All Sales:**
```sql
SELECT 
  s.*,
  e.name as employee_name,
  COUNT(si.id) as item_count
FROM sales s
LEFT JOIN employees e ON s.employee_id = e.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id
ORDER BY s.sale_date DESC;
```

**View All Employees:**
```sql
SELECT * FROM employees ORDER BY created_at DESC;
```

**View All Suppliers:**
```sql
SELECT * FROM suppliers ORDER BY created_at DESC;
```

**View All Expenses:**
```sql
SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC;
```

**View Sale Items (Detailed):**
```sql
SELECT 
  si.*,
  p.name as product_name,
  p.sku
FROM sale_items si
JOIN products p ON si.product_id = p.id
ORDER BY si.id DESC;
```

---

## Step 4: Add New Data via Website

1. **Visit:** https://trackapp-1e6b1.web.app
2. **Add data:**
   - **Inventory** → Add products
   - **Sales** → Create sales
   - **Employees** → Add employees
   - **Suppliers** → Add suppliers
   - **Finances** → Add expenses/income
3. **Refresh DBeaver** → See new data! ✅

---

## 🔍 Useful Queries for DBeaver

### View Everything at Once:
```sql
-- Products count
SELECT 'Products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'Sales', COUNT(*) FROM sales
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 'Suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses;
```

### View Products with Details:
```sql
SELECT 
  id,
  name,
  sku,
  category,
  price,
  cost,
  stock_quantity,
  min_stock_level,
  created_at,
  updated_at
FROM products
ORDER BY created_at DESC;
```

### View Sales with Items:
```sql
SELECT 
  s.id as sale_id,
  s.sale_date,
  s.total_amount,
  s.payment_method,
  e.name as employee,
  COUNT(si.id) as items_count
FROM sales s
LEFT JOIN employees e ON s.employee_id = e.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.sale_date, s.total_amount, s.payment_method, e.name
ORDER BY s.sale_date DESC;
```

### View Low Stock Items:
```sql
SELECT 
  name,
  sku,
  category,
  stock_quantity,
  min_stock_level,
  (stock_quantity - min_stock_level) as difference
FROM products
WHERE stock_quantity <= min_stock_level
ORDER BY difference ASC;
```

---

## ✅ Verification Checklist:

- [ ] Tables created in DBeaver
- [ ] Can see `products` table with data
- [ ] Can see `sales` table
- [ ] Can see `employees` table
- [ ] Can see `suppliers` table
- [ ] Can see `expenses` table
- [ ] New data added via website appears in DBeaver

---

## 🎯 Quick Start:

1. **Create tables** (Step 1 above)
2. **Run this query in DBeaver:**
   ```sql
   SELECT * FROM products;
   ```
3. **If empty, add data via website** → Refresh DBeaver → See it!

---

**Your data should now be visible in DBeaver!** 🎉

