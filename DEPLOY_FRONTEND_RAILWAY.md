# Deploy Frontend to Railway (Without Vercel)

## Quick Steps

1. **Open Railway Dashboard:**
   ```bash
   cd client
   npx @railway/cli open
   ```

2. **Create New Service:**
   - In Railway dashboard, click "New" → "GitHub Repo" or "Empty Service"
   - Name it: `trackapp-frontend`
   - Select the `client` directory as root

3. **Configure Service Settings:**
   - **Root Directory**: `client` (or `/` if deploying from client folder)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run serve`
   - **Environment Variables**:
     - `REACT_APP_API_URL=https://trackapp-production.up.railway.app/api`
     - `NODE_ENV=production`
     - `PORT=3000` (Railway will override this)

4. **Deploy:**
   - Railway will automatically build and deploy
   - Get your frontend URL from the service dashboard

## Alternative: Deploy via CLI

If you want to deploy from the client directory:

```bash
cd client
npx @railway/cli up
```

Then set environment variable:
```bash
npx @railway/cli variables set REACT_APP_API_URL=https://trackapp-production.up.railway.app/api
```

## Your URLs

- **Backend**: https://trackapp-production.up.railway.app
- **Frontend**: Will be shown after deployment (e.g., `https://trackapp-frontend.up.railway.app`)

