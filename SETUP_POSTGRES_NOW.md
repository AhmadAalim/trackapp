# 🚀 Setup PostgreSQL Database - Step by Step

## Architecture Overview
- **Frontend:** Firebase (https://trackapp-1e6b1.web.app) ✅
- **Backend API:** Railway (https://trackapp-production.up.railway.app) ✅  
- **Database:** PostgreSQL on Railway (we're setting this up now)

---

## Step 1: Add PostgreSQL Database to Railway (2 minutes)

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/dashboard
   - Click on your **`trackapp`** project

2. **Add PostgreSQL:**
   - Click **"New"** button (top right)
   - Select **"Database"**
   - Click **"Add PostgreSQL"**
   - Wait 30-60 seconds for provisioning

3. **Get Connection Details:**
   - Click on the new **PostgreSQL** service
   - Go to **"Variables"** tab
   - You'll see these variables (copy them!):
     ```
     PGHOST=xxxxx.railway.app
     PGPORT=5432
     PGDATABASE=railway
     PGUSER=postgres
     PGPASSWORD=xxxxx
     ```

---

## Step 2: Update Backend Environment Variables

1. **Go to your Backend Service** (the Node.js one, not PostgreSQL)
2. **Click "Variables" tab**
3. **Add these new variables:**
   ```
   DB_TYPE=postgres
   DB_HOST=<paste PGHOST value>
   DB_PORT=<paste PGPORT value>
   DB_NAME=<paste PGDATABASE value>
   DB_USER=<paste PGUSER value>
   DB_PASSWORD=<paste PGPASSWORD value>
   DB_SSL=true
   ```

---

## Step 3: Create Database Schema

**Option A: Via Railway CLI (Easiest)**
```bash
cd server
# Set environment variables temporarily
export DB_HOST=<your-pghost>
export DB_PORT=5432
export DB_NAME=railway
export DB_USER=postgres
export DB_PASSWORD=<your-password>
export DB_SSL=true
export DB_TYPE=postgres

# Run migration
node migrations/create-postgres-schema.js
```

**Option B: Via DBeaver (Visual)**
1. Connect DBeaver first (Step 4)
2. Right-click database → SQL Editor → New SQL Script
3. Copy SQL from `server/migrations/create-postgres-schema.js`
4. Run it (F5)

---

## Step 4: Connect DBeaver to PostgreSQL

1. **Open DBeaver**
2. **New Connection:**
   - Click **"New Database Connection"** icon (plug)
   - Select **"PostgreSQL"**
   - Click **"Next"**

3. **Enter Connection Details:**
   - **Host:** `<PGHOST value>` (e.g., `xxxxx.railway.app`)
   - **Port:** `5432` (or your PGPORT)
   - **Database:** `railway` (or your PGDATABASE)
   - **Username:** `postgres` (or your PGUSER)
   - **Password:** `<PGPASSWORD value>` (click "Show password")
   - **SSL:** ✅ Enable → Select **"Require"**

4. **Test & Save:**
   - Click **"Test Connection"**
   - If prompted, download PostgreSQL driver
   - Should show ✅ "Connected"
   - Click **"Finish"**

---

## Step 5: Create Tables in DBeaver

1. **Right-click your database** → **SQL Editor** → **New SQL Script**
2. **Open:** `server/migrations/create-postgres-schema.js`
3. **Copy the SQL** (the part inside schemaSQL variable)
4. **Paste into DBeaver SQL Editor**
5. **Run** (F5 or Run button)
6. **Refresh** database tree → You should see all tables! ✅

---

## Step 6: Redeploy Backend

Railway will automatically redeploy when you update environment variables, but you can also:

```bash
cd server
npm install  # Make sure pg driver is installed
npx @railway/cli up
```

---

## ✅ Verify Everything Works

1. **Check DBeaver:**
   - Expand your database
   - See tables: `products`, `employees`, `suppliers`, `sales`, etc.

2. **Test API:**
   ```bash
   curl https://trackapp-production.up.railway.app/api/health
   curl https://trackapp-production.up.railway.app/api/inventory
   ```

3. **Test Frontend:**
   - Visit: https://trackapp-1e6b1.web.app
   - Try adding a product
   - Check DBeaver → products table → Should see your data! ✅

---

## 🎉 Done!

Now you can:
- ✅ View/edit data in DBeaver
- ✅ Run SQL queries
- ✅ Export/Import data
- ✅ Manage database visually
- ✅ Your app uses PostgreSQL instead of SQLite

---

**Need help?** Check Railway logs: `npx @railway/cli logs`

