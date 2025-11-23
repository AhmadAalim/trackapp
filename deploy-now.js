#!/usr/bin/env node

/**
 * Auto-deploy script for TrackApp
 * This script automatically commits, pushes changes, builds, and deploys to Firebase
 * Run this whenever you want to update the online website
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit', 
      cwd: options.cwd || path.join(__dirname),
      ...options 
    });
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    if (options.continueOnError) {
      return false;
    }
    process.exit(1);
  }
}

log('🚀 Starting auto-deployment process...', 'yellow');

const rootDir = path.join(__dirname);
const clientDir = path.join(rootDir, 'client');

// Check if there are any changes
let hasChanges = false;
try {
  const status = execSync('git status --porcelain', { 
    encoding: 'utf-8',
    cwd: rootDir 
  });
  hasChanges = status.trim().length > 0;
} catch (error) {
  // Git command failed, might not be a git repo
}

if (hasChanges) {
  // Show what will be committed
  log('\n📋 Changes to be deployed:', 'yellow');
  exec('git status --short', { cwd: rootDir });

  // Add all changes
  log('\n📦 Staging changes...', 'green');
  exec('git add -A', { cwd: rootDir });

  // Commit with timestamp
  const commitMsg = `Auto-deploy: ${new Date().toISOString()} - Latest changes`;
  log('\n💾 Committing changes...', 'green');
  try {
    exec(`git commit -m "${commitMsg}"`, { cwd: rootDir });
  } catch (error) {
    log('ℹ️  No changes to commit', 'yellow');
  }

  // Push to GitHub
  log('\n🚀 Pushing to GitHub...', 'green');
  exec('git push origin main', { 
    cwd: rootDir,
    continueOnError: true 
  });
} else {
  log('✅ No changes to commit. Building and deploying current code...', 'yellow');
}

// Build and deploy to Firebase
log('\n📦 Building React app...', 'blue');

// Set environment variable for API URL
process.env.REACT_APP_API_URL = 'https://trackapp-production.up.railway.app/api';

// Build the app
log('Running npm build...', 'green');
exec('npm run build', { cwd: clientDir });

// Check if Firebase CLI is available
try {
  execSync('which firebase', { stdio: 'pipe' });
} catch (error) {
  log('Firebase CLI not found. Installing...', 'yellow');
  exec('npm install -g firebase-tools');
}

// Deploy to Firebase
log('\n🔥 Deploying to Firebase...', 'blue');
exec('firebase deploy --only hosting', { cwd: clientDir });

log('\n✅ Deployment complete!', 'green');
log('🌐 Your app is live at: https://trackapp-1e6b1.web.app', 'green');
log('🔗 Alternative URL: https://trackapp-1e6b1.firebaseapp.com', 'green');

