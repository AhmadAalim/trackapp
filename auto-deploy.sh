#!/bin/bash

# Auto-deploy script - Updates online website with latest changes
# This script commits changes, pushes to GitHub, and triggers deployment

set -e

echo "🚀 Starting auto-deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if there are any changes
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}No changes to deploy. Everything is up to date!${NC}"
  exit 0
fi

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
  exit 0
}

# Push to GitHub (this will trigger Vercel auto-deployment)
echo -e "\n${GREEN}Pushing to GitHub...${NC}"
git push origin main

echo -e "\n${GREEN}✅ Deployment triggered!${NC}"
echo -e "${YELLOW}Vercel will automatically build and deploy your frontend.${NC}"
echo -e "${YELLOW}Backend on Railway should auto-deploy if configured.${NC}"
echo -e "\n${GREEN}Your changes will be live in a few minutes!${NC}"

