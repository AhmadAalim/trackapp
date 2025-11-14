# 🎯 Complete PostgreSQL Setup Guide

## ✅ Step 1: COMPLETE - PostgreSQL Added to Railway
- Database created ✅
- Connection details collected ✅

## 🔧 Step 2: Update Backend Environment Variables

### Option A: Via Railway Dashboard (Recommended)

1. **Go to:** https://railway.app/dashboard
2. **Click your `trackapp` project**
3. **Click your Backend Service** (Node.js, not PostgreSQL)
4. **Go to "Variables" tab**
5. **Add these 7 variables:**

   ```
   DB_TYPE = postgres
   DB_HOST = postgres.railway.internal
   DB_PORT = 5432
   DB_NAME = railway
   DB_USER = postgres
   DB_PASSWORD = FkTqqXqZipmZUVmhnsAfqRSzVtQammVy
   DB_SSL = false
   ```

6. **Save** - Railway will auto-redeploy (wait 1-2 minutes)

### Option B: Via Railway CLI

```bash
cd server
npx @railway/cli variables \
  --set "DB_TYPE=postgres" \
  --set "DB_HOST=postgres.railway.internal" \
  --set "DB_PORT=5432" \
  --set "DB_NAME=railway" \
  --set "DB_USER=postgres" \
  --set "DB_PASSWORD=FkTqqXqZipmZUVmhnsAfqRSzVtQammVy" \
  --set "DB_SSL=false"
```

---

## 🔌 Step 3: Connect DBeaver

### Connection Details:
- **Host:** `postgres.railway.internal`
- **Port:** `5432`
- **Database:** `railway`
- **Username:** `postgres`
- **Password:** `FkTqqXqZipmZUVmhnsAfqRSzVtQammVy`
- **SSL:** Enable (set to "require" or "allow")

### Steps:
1. Open DBeaver
2. New Connection → PostgreSQL
3. Enter details above
4. SSL tab → Enable SSL
5. Test Connection → Should work! ✅
6. Save

**Note:** If `postgres.railway.internal` doesn't work from DBeaver, check Railway PostgreSQL → Settings → Networking for public hostname.

---

## 📊 Step 4: Create Database Schema

### Option A: Via DBeaver (Easiest)

1. **Right-click your database** → **SQL Editor** → **New SQL Script**
2. **Open:** `server/migrations/create-postgres-schema.js`
3. **Copy the SQL** (the part inside `schemaSQL` variable, lines ~7-80)
4. **Paste into DBeaver**
5. **Run** (F5 or Run button)
6. **Refresh** database → You'll see all tables! ✅

### Option B: Via Command Line

```bash
cd server
export DB_HOST=postgres.railway.internal
export DB_PORT=5432
export DB_NAME=railway
export DB_USER=postgres
export DB_PASSWORD=FkTqqXqZipmZUVmhnsAfqRSzVtQammVy
export DB_SSL=false
export DB_TYPE=postgres

node migrations/create-postgres-schema.js
```

---

## ✅ Step 5: Verify Everything Works

1. **Check DBeaver:**
   - Expand database → Tables
   - Should see: `products`, `employees`, `suppliers`, `sales`, etc.

2. **Test Backend API:**
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

Your app now uses PostgreSQL instead of SQLite, and you can manage it with DBeaver!

---

**Quick Reference:**
- Backend: https://trackapp-production.up.railway.app
- Frontend: https://trackapp-1e6b1.web.app
- Database: PostgreSQL on Railway (accessible via DBeaver)

