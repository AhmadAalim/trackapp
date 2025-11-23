# 🚀 Quick Deploy Guide

## The Easiest Way: Use Platform Auto-Deploy

### ✅ Step 1: Enable Auto-Deploy on Vercel (Frontend)

1. Go to https://vercel.com/dashboard
2. Click your project (or import from GitHub if not done)
3. Go to **Settings** → **Git**
4. Make sure your GitHub repo is connected
5. Enable **Auto-Deploy** for `main` branch

**Done!** Every push to GitHub will auto-deploy your frontend.

### ✅ Step 2: Enable Auto-Deploy on Render (Backend)

1. Go to https://dashboard.render.com
2. Click your backend service
3. Go to **Settings** → **Auto-Deploy**
4. Make sure **Auto-Deploy** is enabled
5. Make sure GitHub repo is connected

**Done!** Every push to GitHub will auto-deploy your backend.

---

## 📝 How to Deploy Changes

### Method 1: Using the Deploy Script (Easiest!)

```bash
# Make your changes, then:
./deploy.sh "Your commit message here"

# Or without a message (it will ask):
./deploy.sh
```

### Method 2: Manual Git Commands

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

That's it! Your website will automatically update in 2-5 minutes.

---

## 🎯 What Happens When You Push?

1. **GitHub** receives your code
2. **Vercel** detects the push → Builds and deploys frontend automatically
3. **Render** detects the push → Builds and deploys backend automatically
4. Your website is updated! ✨

---

## ✅ Verify Deployment

After pushing, check:
- **Vercel Dashboard**: See deployment progress
- **Render Dashboard**: See deployment progress  
- **GitHub Actions**: See workflow runs (if using GitHub Actions)

---

## 🔧 Troubleshooting

**Frontend not updating?**
- Check Vercel dashboard for errors
- Make sure auto-deploy is enabled
- Check that you're pushing to `main` branch

**Backend not updating?**
- Check Render dashboard for errors
- Make sure auto-deploy is enabled
- Check environment variables are set correctly

**Need to deploy manually?**
```bash
# Frontend
cd client
vercel --prod

# Backend - Use Render dashboard "Manual Deploy" button
```

---

**🎉 Once auto-deploy is enabled, you never need to manually deploy again!**
