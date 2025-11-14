# 🎯 Quick Steps to See Website Data in DBeaver

## ✅ Current Status:
- DBeaver connected ✅
- Backend API working ✅
- Product created via API ✅

---

## Step 1: Create Tables in DBeaver (If Not Already Created)

### In DBeaver:

1. **Right-click your database** (`railway`) → **SQL Editor** → **New SQL Script**

2. **Open the file:** `CREATE_SCHEMA_SQL.sql` (in your project folder)

3. **Copy ALL the SQL** and paste into DBeaver

4. **Run it** (F5 or click Run button)

5. **Refresh** your database (right-click → Refresh)
   - You should now see tables: `products`, `employees`, `suppliers`, `sales`, etc.

---

## Step 2: Verify Tables Exist

In DBeaver:
- Expand: **railway** → **Schemas** → **public** → **Tables**
- You should see: `products`, `employees`, `suppliers`, `sales`, `sale_items`, `expenses`, `purchase_orders`

If tables don't exist → Run Step 1 above

---

## Step 3: Add Data via Website

### Option A: Via Website (Easiest)

1. **Visit:** https://trackapp-1e6b1.web.app
2. **Go to Inventory** page
3. **Click "Add Product"**
4. **Fill in:**
   - Name: "Test Product"
   - Price: 25.99
   - Stock Quantity: 100
   - Category: "Test"
5. **Click Save**

### Option B: Via API (Quick Test)

```bash
curl -X POST https://trackapp-production.up.railway.app/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"name":"My Product","price":29.99,"stock_quantity":50,"category":"Electronics"}'
```

---

## Step 4: View Data in DBeaver

### Method 1: View Table Data (Easiest)

1. **In DBeaver:**
   - Expand: **railway** → **Schemas** → **public** → **Tables** → **products**
   - **Right-click `products`** → **View Data**
   - You should see your products! ✅

### Method 2: Run SQL Query

1. **Right-click database** → **SQL Editor** → **New SQL Script**

2. **Run this query:**
   ```sql
   SELECT * FROM products ORDER BY created_at DESC;
   ```

3. **You should see all products from your website!** ✅

---

## 🔍 Quick Queries to Try:

```sql
-- View all products
SELECT * FROM products;

-- View products with details
SELECT id, name, price, stock_quantity, category, created_at 
FROM products 
ORDER BY created_at DESC;

-- Count total products
SELECT COUNT(*) as total_products FROM products;

-- View employees
SELECT * FROM employees;

-- View sales
SELECT * FROM sales ORDER BY sale_date DESC;
```

---

## ✅ Verification:

1. **Tables exist?** → Check DBeaver → Tables folder
2. **Data visible?** → Run `SELECT * FROM products;`
3. **New data appears?** → Add product via website → Refresh DBeaver → See it!

---

## 🆘 Troubleshooting:

**No tables visible:**
- Run the CREATE TABLE SQL from `CREATE_SCHEMA_SQL.sql`

**Tables exist but no data:**
- Make sure backend is using PostgreSQL (check Railway env vars: `DB_TYPE=postgres`)
- Add data via website or API
- Refresh DBeaver

**Can't see new data:**
- Refresh DBeaver (F5 or right-click → Refresh)
- Make sure you're looking at the right database (`railway`)

---

**Your data should now be visible in DBeaver!** 🎉

