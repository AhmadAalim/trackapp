#!/bin/bash

echo "🌐 Getting Public Shareable URL..."
echo ""
echo "Make sure your app is running (npm run dev)"
echo ""
echo "Creating public tunnel..."
echo ""

npx -y localtunnel --port 3000 --print-requests

echo ""
echo "✅ Copy the URL above and share it with friends!"
echo "⚠️  Note: The tunnel must stay running while sharing"

