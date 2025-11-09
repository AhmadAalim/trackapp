# 🚀 Quick Database Setup - PostgreSQL + DBeaver

## Step 1: Add PostgreSQL to Railway (2 minutes)

1. Go to: https://railway.app/dashboard
2. Click your `trackapp` project
3. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
4. Wait for it to provision (30 seconds)

## Step 2: Get Connection Details

1. Click on the **PostgreSQL** service
2. Go to **"Variables"** tab
3. Copy these values:
   - `PGHOST`
   - `PGPORT` 
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

## Step 3: Update Backend Environment Variables

1. Click on your **backend service** (the one running Node.js)
2. Go to **"Variables"** tab
3. Add these variables:
   ```
   DB_TYPE=postgres
   DB_HOST=<paste PGHOST>
   DB_PORT=<paste PGPORT>
   DB_NAME=<paste PGDATABASE>
   DB_USER=<paste PGUSER>
   DB_PASSWORD=<paste PGPASSWORD>
   DB_SSL=true
   ```

## Step 4: Connect DBeaver

1. **Open DBeaver**
2. **New Connection** → **PostgreSQL**
3. **Enter:**
   - Host: `<PGHOST>`
   - Port: `<PGPORT>` (usually 5432)
   - Database: `<PGDATABASE>`
   - Username: `<PGUSER>`
   - Password: `<PGPASSWORD>`
   - **Enable SSL:** ✅ Require
4. **Test Connection** → Should work! ✅
5. **Finish**

## Step 5: Create Schema in DBeaver

1. Right-click your database → **SQL Editor** → **New SQL Script**
2. Copy SQL from: `server/migrations/create-postgres-schema.js`
3. Run it (F5)
4. Refresh → You'll see all tables! ✅

## Step 6: Redeploy Backend

```bash
cd server
npm install  # Installs pg driver
npx @railway/cli up
```

## ✅ Done!

- ✅ PostgreSQL database running on Railway
- ✅ Connected to DBeaver
- ✅ Backend using PostgreSQL
- ✅ All tables created

**You can now:**
- View/edit data in DBeaver
- Run SQL queries
- Export/Import data
- Monitor database

---

**Need help?** Check `DATABASE_SETUP.md` for detailed instructions.

