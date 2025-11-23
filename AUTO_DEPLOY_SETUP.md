# Automatic Deployment Setup Guide

This guide will help you set up automatic deployment so that every time you push code to GitHub, it automatically deploys to your online website.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Vercel Credentials (for Frontend)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project (or create a new one)
3. Go to **Settings** → **General**
4. Copy these values:
   - **Team ID** (Organization ID)
   - **Project ID**

5. Go to **Settings** → **Tokens**
   - Create a new token or copy existing one
   - This is your `VERCEL_TOKEN`

### Step 2: Get Render Deploy Hook (for Backend)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service
3. Go to **Settings** → **Webhooks**
4. Copy the **Deploy Hook URL**

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository: `https://github.com/AhmadAalim/trackapp`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these:

   - `VERCEL_TOKEN` - Your Vercel token
   - `VERCEL_ORG_ID` - Your Vercel Organization/Team ID
   - `VERCEL_PROJECT_ID` - Your Vercel Project ID
   - `REACT_APP_API_URL` - Your backend API URL (e.g., `https://your-backend.onrender.com/api`)
   - `RENDER_DEPLOY_HOOK_URL` - Your Render deploy hook URL (optional, if using Render)
   - `RAILWAY_DEPLOY_HOOK_URL` - Your Railway deploy hook URL (optional, if using Railway)

### Step 4: Enable Auto-Deploy on Vercel (Alternative - Easier!)

Instead of using GitHub Actions, you can enable auto-deploy directly in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Git**
4. Connect your GitHub repository
5. Enable **Auto-deploy** for `main` branch

**This is the easiest way!** Vercel will automatically deploy whenever you push to GitHub.

### Step 5: Enable Auto-Deploy on Render (Alternative - Easier!)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service
3. Go to **Settings** → **Auto-Deploy**
4. Make sure **Auto-Deploy** is enabled
5. Connect your GitHub repository if not already connected

**This is the easiest way!** Render will automatically deploy whenever you push to GitHub.

## 📝 How It Works

### Option A: Using Platform Auto-Deploy (Recommended - Easiest!)

1. **Vercel** (Frontend):
   - Connect GitHub repo in Vercel dashboard
   - Enable auto-deploy
   - Every push to `main` → Auto deploys frontend

2. **Render** (Backend):
   - Connect GitHub repo in Render dashboard
   - Enable auto-deploy
   - Every push to `main` → Auto deploys backend

### Option B: Using GitHub Actions (More Control)

The GitHub Actions workflows will:
- Watch for pushes to `main` branch
- Automatically build and deploy frontend to Vercel
- Trigger backend deployment on Render/Railway

## 🎯 Usage

Once set up, simply:

```bash
# Make your changes locally
git add .
git commit -m "Add Clients page"
git push origin main

# That's it! Your website will automatically update in 2-5 minutes
```

## ✅ Verify It's Working

1. Make a small change (add a comment or update text)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. Check deployment status:
   - **Vercel**: Go to your project → **Deployments** tab
   - **Render**: Go to your service → **Events** tab
   - **GitHub**: Go to your repo → **Actions** tab

## 🔧 Troubleshooting

### Frontend not deploying?
- Check Vercel dashboard for errors
- Verify `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` are correct
- Check GitHub Actions logs: Repo → Actions tab

### Backend not deploying?
- Check Render dashboard for errors
- Verify `RENDER_DEPLOY_HOOK_URL` is correct
- Check if Render auto-deploy is enabled

### Need to deploy manually?
```bash
# Frontend
cd client
vercel --prod

# Backend - Trigger via Render dashboard or use deploy hook
```

## 📚 Additional Resources

- [Vercel Auto-Deploy Docs](https://vercel.com/docs/concepts/git)
- [Render Auto-Deploy Docs](https://render.com/docs/auto-deploy)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**🎉 Once set up, every `git push` will automatically update your live website!**

