#!/usr/bin/env node

/**
 * Auto-deploy script for TrackApp
 * This script automatically commits and pushes changes to trigger deployment
 * Run this whenever you want to update the online website
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname),
      ...options 
    });
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

log('🚀 Starting auto-deployment process...', 'yellow');

// Check if there are any changes
try {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (!status.trim()) {
    log('✅ No changes to deploy. Everything is up to date!', 'green');
    process.exit(0);
  }
} catch (error) {
  // Git command failed, might not be a git repo or no changes
}

// Show what will be committed
log('\n📋 Changes to be deployed:', 'yellow');
exec('git status --short');

// Add all changes
log('\n📦 Staging changes...', 'green');
exec('git add -A');

// Commit with timestamp
const commitMsg = `Auto-deploy: ${new Date().toISOString()} - Latest changes`;
log('\n💾 Committing changes...', 'green');
try {
  exec(`git commit -m "${commitMsg}"`);
} catch (error) {
  log('ℹ️  No changes to commit', 'yellow');
  process.exit(0);
}

// Push to GitHub (this will trigger Vercel auto-deployment)
log('\n🚀 Pushing to GitHub...', 'green');
exec('git push origin main');

log('\n✅ Deployment triggered!', 'green');
log('📱 Vercel will automatically build and deploy your frontend.', 'yellow');
log('🔧 Backend on Railway should auto-deploy if configured.', 'yellow');
log('\n✨ Your changes will be live in a few minutes!', 'green');

