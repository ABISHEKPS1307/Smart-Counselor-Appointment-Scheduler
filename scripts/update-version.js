/**
 * Update version.json with current build information
 * Run this script during build/deployment to update version tracking
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION_FILE = path.join(__dirname, '../public/version.json');

function getGitCommitHash() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    return hash;
  } catch (error) {
    console.warn('Could not get git commit hash:', error.message);
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    return branch;
  } catch (error) {
    return 'unknown';
  }
}

function updateVersionFile() {
  const commitHash = getGitCommitHash();
  const branch = getGitBranch();
  const buildTime = new Date().toISOString();
  
  // Generate semantic version from commit hash and timestamp
  const version = `1.${commitHash}.${Date.now()}`;

  const versionData = {
    version,
    commitHash,
    branch,
    buildTime,
    buildTimestamp: Date.now()
  };

  try {
    fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2), 'utf-8');
    console.log('✅ Version file updated successfully');
    console.log(`   Version: ${version}`);
    console.log(`   Commit: ${commitHash}`);
    console.log(`   Branch: ${branch}`);
    console.log(`   Time: ${buildTime}`);
  } catch (error) {
    console.error('❌ Failed to update version file:', error.message);
    process.exit(1);
  }
}

// Run the update
updateVersionFile();
