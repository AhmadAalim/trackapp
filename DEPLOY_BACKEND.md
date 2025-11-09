# Backend Deployment Guide

Your backend is ready to deploy! Here are the steps:

## Option 1: Deploy to Render (Recommended - Free)

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (or use the render.yaml file)
4. Configure:
   - **Name**: trackapp-backend
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `PORT=10000` (Render sets this automatically)
     - `ALLOWED_ORIGINS=https://client-4opfx4inf-amers-projects-b96a46c1.vercel.app`
5. Click "Create Web Service"
6. Once deployed, copy your backend URL (e.g., `https://trackapp-backend.onrender.com`)
7. Update your Vercel frontend with the backend URL:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `REACT_APP_API_URL=https://your-backend-url.onrender.com/api`
   - Redeploy the frontend

## Option 2: Deploy to Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`
5. Get your URL: `railway domain`
6. Update Vercel frontend with the Railway backend URL

## Option 3: Deploy to Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch` (use existing fly.toml)
4. Deploy: `fly deploy`
5. Get your URL and update Vercel frontend

## After Deployment

Once your backend is deployed:

1. **Get your backend URL** (e.g., `https://trackapp-backend.onrender.com`)

2. **Update Vercel Environment Variables**:
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `REACT_APP_API_URL` = `https://your-backend-url.onrender.com/api`
   - Redeploy your frontend

3. **Test the connection**:
   - Visit your frontend URL
   - Check browser console for API errors
   - Test API: `https://your-backend-url.onrender.com/api/health`

Your backend URL will be something like:
- Render: `https://trackapp-backend.onrender.com`
- Railway: `https://trackapp-backend.up.railway.app`
- Fly.io: `https://trackapp-backend.fly.dev`

