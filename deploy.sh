#!/bin/bash

# Auto-Deploy Script
# This script commits your changes and pushes to GitHub
# If auto-deploy is set up, your website will update automatically

echo "🚀 TrackApp Auto-Deploy Script"
echo "================================"
echo ""

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Show current changes
echo "📋 Current changes:"
git status --short
echo ""

# Ask for commit message
if [ -z "$1" ]; then
    read -p "💬 Enter commit message: " commit_message
else
    commit_message="$1"
fi

# Commit changes
echo ""
echo "📝 Committing changes..."
git add .
git commit -m "$commit_message"

# Push to GitHub
echo ""
echo "⬆️  Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Your changes are being deployed..."
echo ""
echo "⏳ Deployment usually takes 2-5 minutes"
echo "📊 Check deployment status:"
echo "   - Vercel: https://vercel.com/dashboard"
echo "   - Render: https://dashboard.render.com"
echo "   - GitHub Actions: https://github.com/AhmadAalim/trackapp/actions"
echo ""

