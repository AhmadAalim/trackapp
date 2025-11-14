# 🚀 Migrate Data & View Everything in DBeaver

## ✅ Good News!
You have existing data:
- **184 products** in SQLite
- **2 sales**
- Plus employees, suppliers, expenses, etc.

Let's migrate it all to PostgreSQL so you can see it in DBeaver!

---

## Step 1: Create PostgreSQL Tables (If Not Already Created)

### In DBeaver:

1. **Right-click database** (`railway`) → **SQL Editor** → **New SQL Script**
2. **Open:** `CREATE_SCHEMA_SQL.sql`
3. **Copy ALL SQL** and paste into DBeaver
4. **Run it** (F5)
5. **Refresh** → Should see 7 tables

---

## Step 2: Migrate Your Existing Data

Run this migration script to copy all data from SQLite to PostgreSQL:

```bash
cd server

# Set PostgreSQL connection details
export DB_HOST=postgres.railway.internal
export DB_PORT=5432
export DB_NAME=railway
export DB_USER=postgres
export DB_PASSWORD=FkTqqXqZipmZUVmhnsAfqRSzVtQammVy
export DB_SSL=false
export DB_TYPE=postgres

# Run migration
node migrations/migrate-sqlite-to-postgres.js
```

This will migrate:
- ✅ 184 products
- ✅ 2 sales
- ✅ All employees
- ✅ All suppliers
- ✅ All expenses
- ✅ All sale items
- ✅ All purchase orders

---

## Step 3: View All Data in DBeaver

### Quick View (Right-Click):
1. Expand: `railway` → `Schemas` → `public` → `Tables`
2. Right-click any table → **View Data**
3. See all your data! ✅

### SQL Queries (Copy & Paste in DBeaver):

**View All Products/Inventory:**
```sql
SELECT * FROM products ORDER BY created_at DESC;
```

**View All Sales:**
```sql
SELECT 
  s.id,
  s.sale_date,
  s.total_amount,
  s.payment_method,
  e.name as employee_name,
  COUNT(si.id) as items_count
FROM sales s
LEFT JOIN employees e ON s.employee_id = e.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.sale_date, s.total_amount, s.payment_method, e.name
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

**View Sale Items with Product Names:**
```sql
SELECT 
  si.*,
  p.name as product_name,
  p.sku,
  s.sale_date
FROM sale_items si
JOIN products p ON si.product_id = p.id
JOIN sales s ON si.sale_id = s.id
ORDER BY si.id DESC;
```

**View Everything Summary:**
```sql
SELECT 
  'Products' as table_name, 
  COUNT(*) as total_records 
FROM products
UNION ALL
SELECT 'Sales', COUNT(*) FROM sales
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 'Suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'Sale Items', COUNT(*) FROM sale_items;
```

---

## Step 4: Verify Data Migration

After migration, run in DBeaver:

```sql
-- Should show 184 products
SELECT COUNT(*) as product_count FROM products;

-- Should show 2 sales
SELECT COUNT(*) as sales_count FROM sales;

-- View first 10 products
SELECT id, name, price, stock_quantity, category 
FROM products 
ORDER BY id 
LIMIT 10;
```

---

## ✅ After Migration:

1. **All your data** will be in PostgreSQL
2. **Visible in DBeaver** - right-click tables → View Data
3. **New data** added via website will automatically appear in DBeaver
4. **You can edit** data directly in DBeaver if needed

---

## 🎯 Quick Commands:

**Migrate data:**
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

**View in DBeaver:**
- Right-click table → View Data
- Or run: `SELECT * FROM products;`

---

**Ready to migrate? Run the migration script above!** 🚀

