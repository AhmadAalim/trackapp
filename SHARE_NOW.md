# 🚀 Get Your Shareable Link - RIGHT NOW!

## Quick Steps (Takes 30 seconds!)

### 1️⃣ Make sure your app is running:
```bash
npm run dev
```
✅ Wait until you see "webpack compiled successfully"

### 2️⃣ Open a NEW terminal and run:
```bash
./get-public-url.sh
```

**OR simply:**
```bash
npx -y localtunnel --port 3000
```

### 3️⃣ You'll get a URL like:
```
https://random-name-123.loca.lt
```

### 4️⃣ **SHARE THAT URL!** 
Copy it and send to your friends. That's it! 🎉

---

## ⚠️ For API to Work (Important!)

The frontend will work, but API calls might fail. To fix this:

**In a THIRD terminal, run:**
```bash
npx -y localtunnel --port 5001
```

You'll get a second URL like: `https://backend-456.loca.lt`

**Then restart your React app with:**
```bash
# Stop the current npm run dev (Ctrl+C)

# Set the API URL and restart
REACT_APP_API_URL=https://backend-456.loca.lt/api npm run dev
```

**Replace `backend-456.loca.lt` with YOUR backend tunnel URL!**

---

## 🎯 Simplest Method (One Command)

Just run this after starting your app:
```bash
npx -y localtunnel --port 3000
```

**Share the URL** - your friends can see the frontend. Some features might need the backend tunnel too (see above).

---

## 📝 Notes

- ✅ **No login needed** - completely public
- ✅ **Keep the tunnel running** - close it and the link stops working
- ✅ **Free to use** - no signup required
- ⚠️ **Temporary** - URL changes each time you restart the tunnel

---

## 🎉 Ready to Share!

Just run the command, copy the URL, and share it! Your friends will be able to access your store management app.

