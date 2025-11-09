#!/bin/bash

echo "🚀 Backend Deployment Script"
echo "=============================="
echo ""
echo "This script will help you deploy your backend to Render."
echo ""

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found!"
    exit 1
fi

echo "✅ Configuration files found:"
echo "   - render.yaml"
echo "   - server/package.json"
echo "   - server/index.js"
echo ""

echo "📋 Next Steps:"
echo ""
echo "1. Go to https://render.com and sign up/login"
echo "2. Click 'New +' → 'Blueprint'"
echo "3. Connect your GitHub repository OR upload render.yaml"
echo "4. Render will automatically detect the configuration"
echo "5. Click 'Apply' to deploy"
echo ""
echo "OR use Render CLI (if you have it installed):"
echo "   render deploy"
echo ""
echo "After deployment:"
echo "1. Copy your backend URL (e.g., https://trackapp-backend.onrender.com)"
echo "2. Update Vercel environment variable:"
echo "   REACT_APP_API_URL=https://your-backend-url.onrender.com/api"
echo "3. Redeploy your frontend"
echo ""

# Try to open Render website
if command -v open &> /dev/null; then
    echo "Opening Render website..."
    open "https://render.com"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://render.com"
fi

