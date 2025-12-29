# Deployment Guide - Urbanist Map

## Step 1: Push to GitHub

1. **Initialize git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a new repository on GitHub:**
   - Go to [github.com](https://github.com) and create a new repository
   - Don't initialize with README (you already have one)

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
   - Sign up/login with your GitHub account

2. **Import your repository:**
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Add Environment Variables:**
   - `NEXT_PUBLIC_MAPBOX_TOKEN` = your Mapbox token
   - `NEXT_PUBLIC_PEXELS_API_KEY` = your Pexels key (optional)

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - You'll get a URL like: `https://your-app.vercel.app`

## Step 3: Create App Icons

You need to create two icon files in the `public/` folder:

- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

**Quick way to create icons:**
1. Use any image editor or online tool
2. Create a simple icon (map pin, globe, or city skyline)
3. Save as PNG at 192x192 and 512x512
4. Place both files in the `public/` folder

**Or use an online generator:**
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## Step 4: Install on Your Phone

### iOS (iPhone):
1. Open Safari (not Chrome)
2. Go to your Vercel URL
3. Tap the Share button (square with arrow)
4. Select "Add to Home Screen"
5. Customize the name and tap "Add"

### Android:
1. Open Chrome
2. Go to your Vercel URL
3. Tap the menu (three dots)
4. Select "Add to Home Screen" or "Install App"
5. Confirm

## That's it!

Your app is now:
- ✅ Live on the web
- ✅ Installable as a PWA on your phone
- ✅ All data saved in browser localStorage
- ✅ Works offline (after first load)

## Updating Your App

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Vercel automatically redeploys!

## Notes

- The CSV file (`sites_of_interest.csv`) is in `public/` so it's accessible
- Replace it anytime and push to update
- All environment variables are set in Vercel dashboard
- No backend needed - everything runs client-side

