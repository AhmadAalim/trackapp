# Step 1: Add PostgreSQL to Railway - Visual Guide

## 🎯 What We're Doing
Adding a PostgreSQL database to your Railway project so you can connect it with DBeaver.

---

## 📝 Detailed Steps

### 1. Open Railway Dashboard
- Go to: **https://railway.app/dashboard**
- Make sure you're logged in

### 2. Select Your Project
- You should see your **`trackapp`** project
- Click on it to open the project

### 3. Add PostgreSQL Database
- Look for the **"New"** button (usually top-right, blue/green button)
- Click **"New"**
- You'll see options like:
  - GitHub Repo
  - Empty Service
  - **Database** ← Click this!
- After clicking "Database", you'll see:
  - **PostgreSQL** ← Click this!
  - MySQL
  - MongoDB
  - etc.

### 4. Wait for Provisioning
- Railway will start creating the PostgreSQL database
- You'll see a loading/spinner animation
- Wait 30-60 seconds
- You'll see a new service appear called **"PostgreSQL"** or **"Postgres"**

### 5. Get Connection Details
- Click on the new **PostgreSQL** service
- Click on the **"Variables"** tab (or "Settings" → "Variables")
- You'll see these variables (IMPORTANT - copy these!):
  ```
  PGHOST=xxxxx.railway.app
  PGPORT=5432
  PGDATABASE=railway
  PGUSER=postgres
  PGPASSWORD=xxxxx (long random string)
  ```

### 6. Copy the Values
- **PGHOST** - something like `containers-us-west-xxx.railway.app`
- **PGPORT** - usually `5432`
- **PGDATABASE** - usually `railway`
- **PGUSER** - usually `postgres`
- **PGPASSWORD** - a long random string (click the eye icon to reveal it)

---

## ✅ What You Should See

After completing Step 1, you should have:
- ✅ A new PostgreSQL service in your Railway project
- ✅ Connection details (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)
- ✅ PostgreSQL database ready to use

---

## 🆘 Troubleshooting

**Can't find "New" button?**
- Make sure you're inside your project (not on the main dashboard)
- Look for a "+" icon or "Add Service" button

**Don't see "Database" option?**
- Make sure you're on the Railway dashboard (not Vercel or other platform)
- Try refreshing the page

**PostgreSQL service not appearing?**
- Wait a bit longer (can take up to 2 minutes)
- Check the Railway status/logs
- Try refreshing the page

---

## ➡️ Next Steps

Once you have the connection details:
1. **Save them somewhere safe** (you'll need them for Step 2)
2. **Tell me when you're done** and I'll help with Step 2!

---

**Need help?** Let me know what you see or if you get stuck!

