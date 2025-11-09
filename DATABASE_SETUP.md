# 🗄️ Database Setup Guide - PostgreSQL with DBeaver

## Step 1: Create PostgreSQL Database on Railway

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/dashboard
   - Click on your `trackapp` project

2. **Add PostgreSQL Database:**
   - Click **"New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will automatically create a PostgreSQL database
   - Note down the connection details (shown in Variables tab)

3. **Get Connection Details:**
   - Click on the PostgreSQL service
   - Go to **"Variables"** tab
   - You'll see:
     - `PGHOST`
     - `PGPORT`
     - `PGDATABASE`
     - `PGUSER`
     - `PGPASSWORD`

## Step 2: Update Railway Backend Environment Variables

1. **Go to your backend service** (the one running `server/index.js`)
2. **Add these environment variables:**
   ```
   DB_TYPE=postgres
   DB_HOST=<PGHOST value>
   DB_PORT=<PGPORT value>
   DB_NAME=<PGDATABASE value>
   DB_USER=<PGUSER value>
   DB_PASSWORD=<PGPASSWORD value>
   DB_SSL=true
   ```

## Step 3: Connect DBeaver to PostgreSQL

1. **Open DBeaver**
2. **Create New Connection:**
   - Click **"New Database Connection"** (plug icon)
   - Select **"PostgreSQL"**
   - Click **"Next"**

3. **Enter Connection Details:**
   - **Host:** `<PGHOST value>` (from Railway)
   - **Port:** `<PGPORT value>` (usually 5432)
   - **Database:** `<PGDATABASE value>`
   - **Username:** `<PGUSER value>`
   - **Password:** `<PGPASSWORD value>` (click "Show password" to see it)
   - **SSL:** Enable **"Use SSL"** → **"Require"**

4. **Test Connection:**
   - Click **"Test Connection"**
   - If prompted, download PostgreSQL driver
   - Should show "Connected" ✅

5. **Save Connection:**
   - Click **"Finish"**
   - Your database will appear in the connection list

## Step 4: Create Database Schema

After connecting, run the migration script:

**Option A: Via DBeaver SQL Editor**
1. Right-click your database → **"SQL Editor"** → **"New SQL Script"**
2. Copy and paste the SQL from `server/migrations/create-postgres-schema.js`
3. Execute the script (F5 or Run button)

**Option B: Via Command Line**
```bash
cd server
node migrations/create-postgres-schema.js
```

## Step 5: Migrate Data from SQLite (Optional)

If you have existing data in SQLite:

```bash
cd server
node migrations/migrate-sqlite-to-postgres.js
```

## Step 6: Update and Redeploy Backend

1. **Install PostgreSQL driver:**
   ```bash
   cd server
   npm install
   ```

2. **Update server code** (already done - uses database.js)

3. **Redeploy to Railway:**
   ```bash
   cd server
   npx @railway/cli up
   ```

## ✅ Verification

1. **Check DBeaver:**
   - Expand your database
   - You should see tables: `products`, `employees`, `suppliers`, `sales`, etc.

2. **Test API:**
   ```bash
   curl https://trackapp-production.up.railway.app/api/health
   ```

3. **Test Database:**
   ```bash
   curl https://trackapp-production.up.railway.app/api/inventory
   ```

## 🔧 Troubleshooting

### Connection Issues
- **SSL Required:** Make sure `DB_SSL=true` in Railway environment variables
- **Host/Port:** Double-check Railway Variables tab for correct values
- **Firewall:** Railway databases are accessible from anywhere (no firewall config needed)

### Schema Issues
- If tables already exist, the migration script will skip them
- Check DBeaver → Tables to verify schema creation

### Migration Issues
- Make sure PostgreSQL driver is installed: `npm install pg`
- Check Railway logs: `npx @railway/cli logs`

## 📊 Using DBeaver

Once connected, you can:
- ✅ View all tables and data
- ✅ Run SQL queries
- ✅ Edit data directly
- ✅ Export/Import data
- ✅ View table relationships
- ✅ Monitor database performance

---

**Your Database URLs:**
- **Railway PostgreSQL:** Check Railway dashboard for connection string
- **DBeaver:** Use connection details from Railway Variables

