#!/usr/bin/env node

// scripts/deploy-mainnet.js
// Helper script for mainnet deployment with proper environment setup

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Preparing mainnet deployment...\n');

// Ensure .env.production exists with correct variables
const prodEnvPath = path.resolve(process.cwd(), '.env.production');
const prodEnvContent = `# Production environment for mainnet deployment
VITE_DFX_NETWORK=ic
VITE_IC_HOST=https://ic0.app
VITE_II_URL=https://identity.ic0.app/#authorize

# vetKD Configuration for mainnet
VITE_VETKD_KEY_NAME=key_1
`;

fs.writeFileSync(prodEnvPath, prodEnvContent);
console.log('✅ Created/updated .env.production');

// Set NODE_ENV to production for the build
process.env.NODE_ENV = 'production';

console.log('🏗️  Building frontend for production...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Frontend build failed');
  process.exit(1);
}

console.log('🔧 Building backend with production vetKD key...');
try {
  execSync('node scripts/build-backend.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Backend build failed');
  process.exit(1);
}

console.log('🌐 Deploying to Internet Computer mainnet...');
try {
  execSync('dfx deploy --network ic', { stdio: 'inherit' });
  console.log('\n✅ Mainnet deployment complete!');
  console.log('\n📝 Don\'t forget to:');
  console.log('   1. Update canister IDs in production environment if needed');
  console.log('   2. Test the deployed application');
  console.log('   3. Monitor cycle usage');
} catch (error) {
  console.error('❌ Mainnet deployment failed');
  process.exit(1);
}