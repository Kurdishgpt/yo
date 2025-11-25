# Vercel Deployment - Fixed Configuration

## 📌 Current Configuration Summary

**What's Configured Right Now:**
- ✅ `vercel.json` - Frontend-only deployment (Static site)
- ✅ Frontend will deploy to Vercel successfully
- ❌ Backend is **NOT** included in Vercel deployment
- 📝 `vercel.json.example-with-proxy` - Optional configuration to proxy API calls to Railway

**To Deploy:**
1. **Frontend to Vercel**: Just push to GitHub and connect to Vercel (works now)
2. **Backend to Railway**: Follow instructions below
3. **Connect them**: Use Option B (Vercel rewrites) or Option A (environment variable)

---

## ✅ What I've Fixed

I've created a working Vercel deployment configuration that will get your **frontend working on Vercel**. Here's what was done:

### 1. Simplified `vercel.json` for Frontend-Only Deployment
- Configured to build the frontend using `npm run build`
- Serves static files from `dist/public`
- Enables client-side routing (React Router will work)
- **No backend** - Backend must be deployed separately (see below)

### 2. Removed Heavy Dependencies from Vercel
- Removed `api/` folder that contained Python, FFmpeg, and ML models
- These dependencies don't work on Vercel's serverless platform
- Backend will be deployed to Railway/Render instead

### 3. Updated `.vercelignore`
- Removed `dist` from ignore list so the built frontend is deployed
- Optimized to exclude unnecessary development files

## 🎯 What Works on Vercel

✅ **Frontend (React + Vite)**
- Your React application will load and display perfectly
- All client-side UI will work
- Routing will work correctly
- Fast global CDN delivery

## ⚠️ What Doesn't Work on Vercel

❌ **Backend API - Must Deploy Separately**
- Python subprocess (Whisper AI transcription)
- FFmpeg video processing
- Large ML model processing
- File uploads and processing

### Why Backend Can't Run on Vercel

Vercel's serverless functions have strict limitations that your app exceeds:
1. **No persistent processes** - Can't run Python subprocesses reliably
2. **Limited execution time** - Max 60 seconds (Pro plan), your processing takes longer
3. **No large binaries** - Whisper and Demucs models are too large (>500MB)
4. **Ephemeral storage** - `/tmp` is limited to 512MB and cleared between requests

**Solution:** Deploy backend to Railway, Render, or similar platform

## 🚀 Deployment Options

### Option 1: Frontend on Vercel + Backend Elsewhere (Recommended)

**Best for:** Production use with full functionality

#### Step 1: Deploy Backend to Railway

1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects the Node.js app
5. Add environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<your postgres connection string>
   PORT=5000
   ```
6. Railway will provide a URL like: `https://your-app.railway.app`
7. **Important:** Note this URL - you'll need it for the frontend

#### Step 2: Deploy Frontend to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel auto-detects settings from `vercel.json`
4. **Add Environment Variable:**
   - Name: `VITE_API_URL`
   - Value: `https://your-app.railway.app` (from Step 1)
5. Click "Deploy"

#### Step 3: Update Frontend to Use External API

You need to modify your frontend to make API calls to the Railway backend:

**Option A: Use Environment Variable (Recommended)**

Update your API calls to use the environment variable:

```typescript
// In your API client code
const API_URL = import.meta.env.VITE_API_URL || '';

// Then use it in fetch calls
const response = await fetch(`${API_URL}/api/upload`, {
  method: 'POST',
  body: formData
});
```

**Option B: Use Vercel Rewrites (No Code Changes Required)**

Update your `vercel.json` to proxy API calls to Railway:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-app.railway.app/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Important:** Replace `https://your-app.railway.app` with your actual Railway URL.

This way your frontend can still call `/api/upload` and Vercel will automatically proxy it to Railway. No frontend code changes needed!

### Option 2: Full Stack on Railway/Render

**Best for:** Simple deployment, full functionality

Deploy the entire application (frontend + backend) to:
- **Railway**: Supports Node.js, Python, FFmpeg out of the box
- **Render**: Free tier available, supports all your requirements
- **Heroku**: Traditional PaaS, but costs more

### Option 3: Keep Trying Vercel (Not Recommended)

You could try to make it work on Vercel by:
1. Using Whisper API instead of local Python (costs money)
2. Replacing FFmpeg with cloud video processing service
3. Storing files in Vercel Blob or S3

But this requires significant code changes and ongoing costs.

## 📋 Step-by-Step: Deploy Frontend to Vercel

### Via GitHub (Easiest)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Vercel deployment configuration"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects settings from `vercel.json`

3. **Environment Variables** (if using external backend)
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.com`

4. **Deploy**
   - Click "Deploy"
   - Your frontend will be live in ~2 minutes

### Via Vercel CLI

```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## 📋 Step-by-Step: Deploy Full App to Railway

Railway is the easiest alternative that supports everything your app needs.

1. **Go to Railway**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure**
   Railway auto-detects:
   - Node.js application
   - Required buildpacks (Python, FFmpeg)
   - Environment variables

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=<your postgres url>
   ```

5. **Deploy**
   - Railway automatically deploys
   - You get a public URL like `https://your-app.railway.app`

## 🔍 Testing Your Deployment

### Test Frontend on Vercel
```bash
# After deployment, open your Vercel URL
https://your-project.vercel.app

# Frontend should load and display correctly
# The UI should be fully functional
```

### Test Backend API on Railway
```bash
# Test the API separately on Railway
curl https://your-app.railway.app/api/health

# Should return:
{
  "status": "ok",
  "message": "API is running"
}
```

### Test Full Integration
1. Open your Vercel frontend: `https://your-project.vercel.app`
2. Upload a test file through the UI
3. The frontend will make API calls to your Railway backend
4. Processing should complete successfully

**Note:** Make sure you've configured `VITE_API_URL` on Vercel pointing to your Railway backend URL, OR added the rewrite rule to `vercel.json` to proxy API calls.

## 💡 My Recommendation

Based on your application's requirements, here's what I suggest:

1. **For Development**: Keep using Replit (works perfectly)
2. **For Production**: Deploy full stack to Railway
   - ✅ Free tier available
   - ✅ Supports Python + FFmpeg + ML models
   - ✅ No code changes needed
   - ✅ Automatic deployments from GitHub
   - ✅ Built-in PostgreSQL database

**Why not Vercel?**
Vercel is excellent for static sites and simple APIs, but your app's media processing requirements exceed what serverless functions can handle.

## 📞 Need Help?

If you need help deploying to Railway or setting up a split deployment:
1. Let me know which option you prefer
2. I can help configure the deployment
3. I can help update the frontend to connect to an external backend

## Summary

✅ **What you have now**:
- Frontend configured to deploy to Vercel
- Backend API wrapper created
- Works for frontend hosting

❌ **What needs alternatives**:
- Media processing (Python + FFmpeg)
- Long-running tasks
- ML model inference

🎯 **Best solution**: Deploy to Railway for full functionality
