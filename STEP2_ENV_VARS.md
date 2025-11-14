# Step 2: Update Backend Environment Variables

## ✅ Connection Details Ready:
- PGHOST: `postgres.railway.internal`
- PGPORT: `5432`
- PGDATABASE: `railway`
- PGUSER: `postgres`
- PGPASSWORD: `FkTqqXqZipmZUVmhnsAfqRSzVtQammVy`

---

## 🎯 Update Backend Environment Variables

Since Railway CLI needs interactive mode, let's do this via the Railway Dashboard:

### Via Railway Dashboard (Easiest):

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/dashboard
   - Click your **`trackapp`** project

2. **Select Your Backend Service:**
   - Click on the service running Node.js (not PostgreSQL)
   - This is the one that runs `server/index.js`

3. **Go to Variables Tab:**
   - Click **"Variables"** tab
   - Or **"Settings"** → **"Variables"**

4. **Add These Variables:**
   Click **"New Variable"** for each:
   
   ```
   DB_TYPE = postgres
   DB_HOST = postgres.railway.internal
   DB_PORT = 5432
   DB_NAME = railway
   DB_USER = postgres
   DB_PASSWORD = FkTqqXqZipmZUVmhnsAfqRSzVtQammVy
   DB_SSL = false
   ```

5. **Save:**
   - Railway will automatically redeploy your backend
   - Wait 1-2 minutes for redeployment

---

## ✅ Verification:

After adding variables, check:
- Backend service should show "Redeploying" or "Building"
- Wait for deployment to complete
- Check logs to see if PostgreSQL connection works

---

## ➡️ Next Steps:

Once backend is redeployed:
1. Create database schema (Step 3)
2. Connect DBeaver (Step 4)
3. Test everything!

