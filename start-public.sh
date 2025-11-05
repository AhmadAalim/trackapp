#!/bin/bash
echo "Starting TrackApp with public sharing..."
echo ""
echo "Step 1: Starting app servers..."
npm run dev &
sleep 10
echo ""
echo "Step 2: Creating public tunnel..."
echo "Waiting for React app to start..."
sleep 15
echo ""
echo "Creating public URL..."
npx -y localtunnel --port 3000 --print-requests
