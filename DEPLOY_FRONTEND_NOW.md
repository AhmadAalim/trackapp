# 🚀 Deploy Frontend to Railway (Step-by-Step)

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/dashboard
   - Or run: `cd client && npx @railway/cli open`

2. **Create New Service:**
   - Click on your project (`trackapp`)
   - Click **"New"** button → **"GitHub Repo"**
   - Select your repository: `AhmadAalim/trackapp`
   - Railway will ask: "Configure a service"
   - **IMPORTANT**: Click **"Configure"** and set:
     - **Root Directory**: `client`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run serve`

3. **Set Environment Variables:**
   - In the new service, go to **Variables** tab
   - Add:
     - `REACT_APP_API_URL` = `https://trackapp-production.up.railway.app/api`
     - `NODE_ENV` = `production`

4. **Deploy:**
   - Railway will automatically deploy
   - Get your frontend URL from the **Settings** → **Domains** section

## Option 2: Render (Alternative - Also Free)

1. Go to: https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `trackapp-frontend`
   - **Root Directory**: `client`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run serve`
   - **Environment Variables**:
     - `REACT_APP_API_URL=https://trackapp-production.up.railway.app/api`
     - `NODE_ENV=production`
5. Click **"Create Web Service"**
6. Wait for deployment (5-10 minutes)
7. Your frontend will be at: `https://trackapp-frontend.onrender.com`

## Option 3: Netlify (Also Free)

1. Go to: https://netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub and select your repo
4. Configure:
   - **Base directory**: `client`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `client/build`
   - **Environment Variables**:
     - `REACT_APP_API_URL=https://trackapp-production.up.railway.app/api`
5. Deploy!

---

## Quick Deploy Command (Railway)

If you want to try CLI again from the client directory:

```bash
cd client
npx @railway/cli up
```

Then set the API URL:
```bash
npx @railway/cli variables set REACT_APP_API_URL=https://trackapp-production.up.railway.app/api
```

---

**Your Backend URL:** `https://trackapp-production.up.railway.app`  
**Your Frontend URL:** Will be shown after deployment

