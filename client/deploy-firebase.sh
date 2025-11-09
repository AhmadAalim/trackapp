#!/bin/bash

# Firebase Deployment Script for TrackApp
# This script builds and deploys the frontend to Firebase with the correct API URL

echo "🚀 Building React app with Railway backend URL..."
cd "$(dirname "$0")"

# Set the backend API URL
export REACT_APP_API_URL=https://trackapp-production.up.railway.app/api

# Build the app
echo "📦 Building..."
npm run build

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://trackapp-1e6b1.web.app"
echo "🔗 Alternative URL: https://trackapp-1e6b1.firebaseapp.com"

