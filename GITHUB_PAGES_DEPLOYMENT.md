# GitHub Pages Deployment Guide

## Problem Fixed
Your GitHub Pages deployment at `https://rahand-tech.github.io/yo/` was showing a "404 Page Not Found" error. This happened because GitHub Pages doesn't natively support Single Page Applications (SPAs) with client-side routing.

## Changes Made

### 1. **vite.config.ts**
- Added `base: "/yo/"` configuration so all assets load from the correct subdirectory
- Added 404.html to the build output

### 2. **client/src/App.tsx**
- Configured wouter Router to use the correct base path
- Now properly handles the `/yo/` subdirectory

### 3. **client/index.html**
- Added redirect handling script for GitHub Pages SPA routing

### 4. **client/404.html** (New file)
- Created a 404 redirect page that handles direct URL access
- This is the GitHub Pages SPA workaround

## How to Deploy

### Step 1: Build the Production Bundle
```bash
npm run build
```

This will create optimized production files in `dist/public/`

### Step 2: Deploy to GitHub Pages

You have two options:

#### Option A: Manual Deployment
1. Copy everything from `dist/public/` to your gh-pages branch
2. Make sure both `index.html` and `404.html` are in the root
3. Push to GitHub

#### Option B: Automated with gh-pages (Recommended)
The `gh-pages` package is already installed. Add this script to your workflow:

1. In your local terminal or GitHub Actions, run:
```bash
npx gh-pages -d dist/public -b gh-pages
```

Or add this to package.json scripts:
```json
"deploy": "npm run build && gh-pages -d dist/public"
```

Then run:
```bash
npm run deploy
```

### Step 3: Verify Deployment
After deployment, visit:
- Main page: `https://rahand-tech.github.io/yo/`
- Should load without 404 errors

## How It Works

1. **Base Path**: Vite now knows to serve all assets from `/yo/` instead of root
2. **Router**: Wouter router uses the base path for all navigation
3. **404 Handling**: When someone directly accesses a route (e.g., `/yo/some-page`):
   - GitHub Pages serves the 404.html file
   - 404.html redirects to index.html with the path as a query parameter
   - index.html reads the query parameter and navigates to the correct route

## Testing Locally

The app will continue to work normally in development mode at `http://localhost:5000` because the base path is only applied in production builds.

## Important Notes

- The base path is set to `/yo/` - if you change your repository name or subdirectory, update `vite.config.ts`
- Both `index.html` and `404.html` must be deployed to the gh-pages branch
- Clear your browser cache after deploying to see changes
