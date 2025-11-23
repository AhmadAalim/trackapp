#!/bin/bash

# Auto-deploy script - Updates online website with latest changes
# This script commits changes, pushes to GitHub, builds, and deploys to Firebase

set -e

echo "🚀 Starting auto-deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$SCRIPT_DIR/client"

# Check if there are any changes
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}No changes to commit. Building and deploying current code...${NC}"
else
  # Show what will be committed
  echo -e "${YELLOW}Changes to be deployed:${NC}"
  git status --short

  # Add all changes
  echo -e "\n${GREEN}Staging changes...${NC}"
  git add -A

  # Commit with timestamp
  COMMIT_MSG="Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S') - Latest changes"
  echo -e "\n${GREEN}Committing changes...${NC}"
  git commit -m "$COMMIT_MSG" || {
    echo "No changes to commit"
  }

  # Push to GitHub
  echo -e "\n${GREEN}Pushing to GitHub...${NC}"
  git push origin main || {
    echo -e "${YELLOW}Warning: Could not push to GitHub. Continuing with Firebase deployment...${NC}"
  }
fi

# Build and deploy to Firebase
echo -e "\n${BLUE}Building React app...${NC}"
cd "$CLIENT_DIR"

# Set the backend API URL
export REACT_APP_API_URL=https://trackapp-production.up.railway.app/api

# Build the app
echo -e "${GREEN}Running npm build...${NC}"
npm run build

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
  echo -e "${YELLOW}Firebase CLI not found. Installing...${NC}"
  npm install -g firebase-tools
fi

# Deploy to Firebase
echo -e "\n${BLUE}🔥 Deploying to Firebase...${NC}"
firebase deploy --only hosting

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your app is live at: https://trackapp-1e6b1.web.app${NC}"
echo -e "${GREEN}🔗 Alternative URL: https://trackapp-1e6b1.firebaseapp.com${NC}"

