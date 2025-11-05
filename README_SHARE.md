# 🌐 Share Your Website - Super Simple!

## ✅ Just 2 Steps:

### Step 1: Make sure your app is running
```bash
npm run dev
```

### Step 2: Get your public URL
```bash
npx -y localtunnel --port 3000
```

**You'll see:**
```
your url is: https://random-name-123.loca.lt
```

**Copy that URL and share it with your friends!** 🎉

---

## ⚠️ For Full Functionality (Optional)

If you want API calls to work from the shared link:

1. **Get backend tunnel URL:**
   ```bash
   npx -y localtunnel --port 5001
   ```
   Copy the URL (e.g., `https://backend-456.loca.lt`)

2. **Stop your current app** (Ctrl+C) and restart with:
   ```bash
   REACT_APP_API_URL=https://backend-456.loca.lt/api npm run dev
   ```
   (Replace with YOUR backend URL)

3. **Share the frontend URL** from Step 2

---

## 🎯 Easiest Way

Just run this one command:
```bash
npx -y localtunnel --port 3000
```

**Share the URL you get** - your friends can see your website!

**Note:** Keep the terminal open while sharing. Close it = link stops working.

---

## ✅ That's It!

No login required. Just share the URL! 🚀

