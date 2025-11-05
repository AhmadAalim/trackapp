# 🌐 Share Your App - Simple Guide

## Step-by-Step Instructions

### Step 1: Start Your App
```bash
npm run dev
```
Wait until you see:
- ✅ Server running on port 5001
- ✅ React app compiled successfully

### Step 2: Create Public URL (Choose One Method)

#### Method A: Single Command (Recommended)
Open a **NEW terminal** and run:
```bash
npx -y localtunnel --port 3000
```

You'll get a URL like: `https://random-name.loca.lt`

**That's your shareable link!** Share it with friends.

#### Method B: Full Setup (Backend + Frontend)
If Method A doesn't work for API calls:

1. **Frontend tunnel:**
   ```bash
   npx -y localtunnel --port 3000
   ```
   Copy the URL (e.g., `https://abc123.loca.lt`)

2. **Backend tunnel (in another terminal):**
   ```bash
   npx -y localtunnel --port 5001
   ```
   Copy the URL (e.g., `https://xyz789.loca.lt`)

3. **Restart React with backend URL:**
   - Stop the current `npm run dev`
   - In your terminal, run:
   ```bash
   REACT_APP_API_URL=https://xyz789.loca.lt/api cd client && npm start
   ```
   - In another terminal, run:
   ```bash
   cd server && npm start
   ```

4. **Share the frontend URL:** `https://abc123.loca.lt`

## ⚠️ Important Notes

- **Keep both terminals open** - the app and tunnel must stay running
- **The URL works as long as:**
  - Your computer is on
  - The app is running
  - The tunnel is active
- **No login required** - your friends can access everything

## 🎉 That's It!

Once you have the URL from Step 2, Method A, just share it:
```
https://random-name.loca.lt
```

Your friends can open it in their browser and see your app!

