# 🔧 How to Fix the 404/405 Errors on Your Deployed App

## 🤔 What's Happening?

You're seeing these errors:
- **404** on Vercel: "Request failed with status code 404"
- **405** on Netlify: "Request failed with status code 405"

**Why?** Your frontend is deployed on Vercel/Netlify, but there's **no backend** to process the files! The frontend is trying to call `/api/upload` but there's no server to handle it.

## ✅ The Fix (2 Simple Steps)

### Step 1: Deploy Your Backend to Railway

Railway is a platform that can run your full backend (Python, ffmpeg, Express server).

1. **Go to [Railway.app](https://railway.app)** and sign up (free)

2. **Create New Project** → **Deploy from GitHub repo**

3. **Connect your GitHub repository**

4. **Railway will automatically detect your app** and deploy it

5. **Add Environment Variables** (in Railway dashboard):
   ```
   DATABASE_URL=your-postgres-url (Railway provides this automatically)
   ```

6. **Copy your Railway URL** - It will look like:
   ```
   https://kurdish-dubbing-production.up.railway.app
   ```

### Step 2: Configure Your Frontend to Use the Backend

You have **two options**:

#### Option A: Environment Variable (Recommended)

**On Vercel:**
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add a new variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-app.railway.app` (your Railway URL from Step 1)
4. **Redeploy** your Vercel app

**On Netlify:**
1. Go to your Netlify site dashboard
2. Click **Site settings** → **Environment variables**
3. Add a new variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-app.railway.app` (your Railway URL from Step 1)
4. **Redeploy** your Netlify site

#### Option B: Use Vercel Proxy (Advanced)

If you want to keep using `/api/upload` without environment variables, update your `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/api/(.*)",
      "dest": "https://your-app.railway.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

Replace `https://your-app.railway.app` with your actual Railway URL.

## 🧪 Testing

After completing both steps:

1. **Visit your Vercel/Netlify URL**
2. **Upload a test file**
3. **It should work!** ✨

The frontend will now send requests to your Railway backend.

## 💡 Why This Works

```
┌─────────────┐           ┌─────────────┐
│   Vercel    │  calls    │   Railway   │
│  (Frontend) │ ────────> │  (Backend)  │
│  Static UI  │           │  API Server │
└─────────────┘           └─────────────┘
                            - Python
                            - ffmpeg
                            - Database
```

- **Vercel/Netlify**: Hosts your React app (fast, free)
- **Railway**: Runs your backend (Python, ffmpeg, database)
- **VITE_API_URL**: Tells the frontend where to find the backend

## 🆘 Troubleshooting

**Still getting errors?**
- Make sure Railway deployment succeeded (check Railway logs)
- Verify the `VITE_API_URL` is set correctly
- Make sure there's no trailing slash: `https://your-app.railway.app` (not `https://your-app.railway.app/`)
- Redeploy your frontend after setting environment variables

**Railway deployment failed?**
- Check Railway logs for errors
- Make sure all dependencies are in `package.json`
- Check that `requirements.txt` is in the root directory (for Python)

**Need help?**
1. Check Railway logs for backend errors
2. Check browser console for frontend errors
3. Make sure both deployments are successful before testing

---

**Quick Test on Local Replit:**
Your Replit version works because the frontend and backend run on the same server (port 5000). In production, they're separate, so you need to connect them with `VITE_API_URL`.
