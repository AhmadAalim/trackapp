# 🔌 Connect DBeaver to PostgreSQL

## Connection Details:
- **Host:** `postgres.railway.internal` (or check Railway for public hostname)
- **Port:** `5432`
- **Database:** `railway`
- **Username:** `postgres`
- **Password:** `FkTqqXqZipmZUVmhnsAfqRSzVtQammVy`

---

## 📝 Step-by-Step DBeaver Setup:

### 1. Open DBeaver
- Launch DBeaver application

### 2. Create New Connection
- Click **"New Database Connection"** icon (plug icon) or
- **Database** → **New Database Connection**

### 3. Select PostgreSQL
- In the connection list, find and select **"PostgreSQL"**
- Click **"Next"**

### 4. Enter Connection Details:
Fill in the **"Main"** tab:
- **Host:** `postgres.railway.internal`
  - ⚠️ If this doesn't work, check Railway PostgreSQL service → Settings → Networking for public hostname
- **Port:** `5432`
- **Database:** `railway`
- **Username:** `postgres`
- **Password:** `FkTqqXqZipmZUVmhnsAfqRSzVtQammVy`
  - Check **"Show password"** to verify

### 5. Configure SSL (Important!)
- Go to **"SSL"** tab
- Check **"Use SSL"**
- SSL Mode: Select **"require"** or **"allow"**

### 6. Test Connection
- Click **"Test Connection"** button
- If driver missing, DBeaver will prompt to download PostgreSQL driver
- Click **"Download"** and wait
- Should show ✅ **"Connected"**

### 7. Save Connection
- Click **"Finish"**
- Your database will appear in the connection list

---

## 🆘 Troubleshooting:

**"Connection refused" or "Host not found":**
- `postgres.railway.internal` is for internal Railway connections
- For DBeaver, you might need the public hostname
- Check Railway → PostgreSQL → Settings → Networking
- Or try enabling "Public Networking" in Railway

**"SSL required" error:**
- Make sure SSL is enabled in DBeaver connection settings
- Set SSL Mode to "require" or "allow"

**"Authentication failed":**
- Double-check username: `postgres`
- Double-check password: `FkTqqXqZipmZUVmhnsAfqRSzVtQammVy`
- Make sure no extra spaces

---

## ✅ Once Connected:

You should see:
- Database: `railway`
- Schemas: `public`
- Tables: (empty for now, we'll create them next)

---

## ➡️ Next: Create Database Schema

After connecting, we'll create the tables using the migration script!

