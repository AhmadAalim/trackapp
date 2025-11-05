#!/bin/bash

echo "🌐 ==========================================="
echo "🌐 Creating Public Shareable Link..."
echo "🌐 ==========================================="
echo ""

# Check if app is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Warning: App doesn't seem to be running on port 3000"
    echo "   Please run 'npm run dev' first"
    echo ""
fi

if ! lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Warning: Server doesn't seem to be running on port 5001"
    echo "   Please run 'npm run dev' first"
    echo ""
fi

echo "⏳ Creating tunnels..."
echo ""

# Create frontend tunnel
echo "🚀 Frontend tunnel (port 3000)..."
FRONTEND_URL=$(npx -y localtunnel --port 3000 --print-requests 2>&1 | grep -o 'https://[^ ]*' | head -1) &

sleep 2

# Create backend tunnel  
echo "🚀 Backend tunnel (port 5001)..."
BACKEND_URL=$(npx -y localtunnel --port 5001 --print-requests 2>&1 | grep -o 'https://[^ ]*' | head -1) &

sleep 3

echo ""
echo "✅ ==========================================="
echo "✅ YOUR SHAREABLE LINK:"
echo "✅ $FRONTEND_URL"
echo "✅ ==========================================="
echo ""
echo "📋 Backend URL: $BACKEND_URL"
echo ""
echo "⚠️  To make API work, restart your app with:"
echo "   REACT_APP_API_URL=$BACKEND_URL/api npm run dev"
echo ""
echo "💡 Or share the frontend URL - they can see the UI!"
echo ""
echo "🛑 Press Ctrl+C to stop tunnels"

