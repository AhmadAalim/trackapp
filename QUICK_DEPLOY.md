# 🚀 Quick Backend Deployment

Your backend is ready to deploy! Here's the fastest way:

## Deploy to Render (Recommended - 5 minutes)

1. **Go to Render**: https://render.com
2. **Sign up/Login** (free account)
3. **Click "New +" → "Web Service"**
4. **Connect your repository** OR use "Public Git repository" and paste your repo URL
5. **Configure**:
   - **Name**: `trackapp-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Environment Variables** (click "Advanced"):
     ```
     NODE_ENV=production
     PORT=10000
     ALLOWED_ORIGINS=https://client-4opfx4inf-amers-projects-b96a46c1.vercel.app
     ```
6. **Click "Create Web Service"**
7. **Wait 5-10 minutes** for deployment
8. **Copy your backend URL** (e.g., `https://trackapp-backend.onrender.com`)

## Update Frontend

Once backend is deployed:

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your `client` project
3. Go to **Settings → Environment Variables**
4. Add/Update:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
   - **Environment**: Production (and Preview)
5. Click **Save**
6. Go to **Deployments** tab
7. Click **⋯** on latest deployment → **Redeploy**

## Test Your Deployment

1. **Backend Health Check**: `https://your-backend-url.onrender.com/api/health`
2. **Frontend**: Visit your Vercel URL and test the app!

## Alternative: Railway (Faster, but requires CLI)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway domain
```

Then update Vercel with the Railway URL.

---

**Your Backend URLs:**
- Vercel (serverless - limited): `https://server-2bkelt47h-amers-projects-b96a46c1.vercel.app`
- Render (recommended): Deploy using steps above
- Railway: Use CLI commands above

**Your Frontend URL:**
- `https://client-4opfx4inf-amers-projects-b96a46c1.vercel.app`

