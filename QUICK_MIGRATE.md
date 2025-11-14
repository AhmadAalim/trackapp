# ⚡ Quick Migration Guide

## Your Data:
- 184 products
- 2 sales  
- 1 employee
- 1 supplier
- 4 expenses

---

## Step 1: Create Tables in DBeaver (Do This First!)

1. **In DBeaver:**
   - Right-click database (`railway`) → **SQL Editor** → **New SQL Script**
   - Open file: `CREATE_SCHEMA_SQL.sql`
   - Copy ALL SQL and paste
   - **Run it** (F5)
   - **Refresh** database

---

## Step 2: Run Migration Script

Copy and paste this entire block into your terminal:

```bash
cd /Users/ahmadaalim/trackapp/server
export DB_HOST=postgres.railway.internal
export DB_PORT=5432
export DB_NAME=railway
export DB_USER=postgres
export DB_PASSWORD=FkTqqXqZipmZUVmhnsAfqRSzVtQammVy
export DB_SSL=false
export DB_TYPE=postgres
node migrations/migrate-sqlite-to-postgres.js
```

This will migrate all 184 products, 2 sales, and everything else!

---

## Step 3: View in DBeaver

After migration, in DBeaver:

**Right-click any table** → **View Data**

Or run queries:
```sql
SELECT * FROM products;
SELECT * FROM sales;
SELECT * FROM employees;
SELECT * FROM expenses;
```

---

**That's it! Your data will be in DBeaver!** 🎉

