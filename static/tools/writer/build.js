#!/usr/bin/env node

// Simple build script to setup and build the Writer app
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Writer App...');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
}

// Build the app
console.log('🏗️ Building for production...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build complete!');
  
  // Copy dist files to replace the current CDN-based version
  const distDir = path.join(__dirname, 'dist');
  const targetDir = __dirname;
  
  if (fs.existsSync(distDir)) {
    console.log('📁 Build output available in ./dist/');
    console.log('');
    console.log('To use the built version:');
    console.log('1. Backup current index.html: mv index.html index-cdn.html');
    console.log('2. Copy built files: cp dist/index.html . && cp -r dist/assets .');
    console.log('3. Or serve directly from dist: cd dist && python3 -m http.server 8080');
  }
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}