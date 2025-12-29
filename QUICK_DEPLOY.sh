#!/bin/bash

# Quick deployment script for Urbanist Map

echo "🚀 Urbanist Map - Quick Deploy Setup"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Urbanist Map"
    echo "✅ Git initialized"
    echo ""
    echo "⚠️  Next steps:"
    echo "1. Create a new repository on GitHub (don't initialize with README)"
    echo "2. Run these commands (replace with your repo URL):"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
else
    echo "✅ Git already initialized"
    echo ""
    echo "Current status:"
    git status --short
fi

echo ""
echo "📱 To deploy:"
echo "1. Push to GitHub (see commands above)"
echo "2. Go to vercel.com and import your GitHub repo"
echo "3. Add environment variables in Vercel:"
echo "   - NEXT_PUBLIC_MAPBOX_TOKEN"
echo "   - NEXT_PUBLIC_PEXELS_API_KEY (optional)"
echo "4. Create app icons: icon-192.png and icon-512.png in public/ folder"
echo "5. Install on phone from Vercel URL"
echo ""
echo "📖 See DEPLOY.md for detailed instructions"

