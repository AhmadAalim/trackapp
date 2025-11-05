# How to Share Your TrackApp

## Quick Start - Share with Public URL

### Option 1: Using Localtunnel (Free, No Signup Required)

1. **Install localtunnel globally** (if not already installed):
   ```bash
   npm install -g localtunnel
   ```

2. **Start your app normally:**
   ```bash
   npm run dev
   ```

3. **In a new terminal, create a public tunnel:**
   ```bash
   lt --port 3000
   ```
   
   This will give you a URL like: `https://random-name.loca.lt`

4. **Share that URL with your friends!**
   - They can access your app at that URL
   - No login required
   - They can browse all features

### Option 2: Using ngrok (More Stable)

1. **Sign up for free at:** https://ngrok.com

2. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

3. **Start your app:**
   ```bash
   npm run dev
   ```

4. **Create a public tunnel:**
   ```bash
   ngrok http 3000
   ```
   
   This will give you a URL like: `https://abc123.ngrok.io`

5. **Share the URL with friends!**

### Option 3: Deploy to Vercel/Netlify (Permanent URL)

For a permanent shareable link, you can deploy to:
- **Vercel**: https://vercel.com (Free tier available)
- **Netlify**: https://netlify.com (Free tier available)
- **Railway**: https://railway.app (Free tier available)

## Important Notes

- **Make sure your server is running** on port 5001 before sharing
- The public URL will work as long as:
  - Your computer is on
  - The app is running (`npm run dev`)
  - The tunnel service is active
- **For permanent sharing**, consider deploying to a hosting service

## Current Setup

Your app is already configured to work publicly:
- ✅ No authentication required
- ✅ CORS enabled for cross-origin requests
- ✅ All features accessible

Just start the tunnel and share the URL!

