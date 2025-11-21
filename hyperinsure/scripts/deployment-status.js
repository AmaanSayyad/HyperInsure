#!/usr/bin/env node

/**
 * HyperInsure Deployment Status Script
 * 
 * Shows the current deployment status for testnet and mainnet
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function loadDeploymentRecord(network) {
  try {
    const recordPath = join(projectRoot, 'deployments', `${network}-latest.json`);
    if (!existsSync(recordPath)) {
      return null;
    }
    return JSON.parse(readFileSync(recordPath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function showDeploymentStatus(network) {
  const record = loadDeploymentRecord(network);
  
  console.log(`\n📋 ${network.toUpperCase()} Deployment Status`);
  console.log('='.repeat(50));
  
  if (!record) {
    console.log('❌ No deployment found');
    return;
  }
  
  console.log(`✅ Deployed: ${formatTimestamp(record.timestamp)}`);
  console.log(`🌐 Network: ${record.config.name}`);
  console.log(`📊 API: ${record.config.apiUrl}`);
  console.log(`🔍 Explorer: ${record.config.explorerUrl || 'N/A'}`);
  
  console.log(`\n📦 Contracts (${Object.keys(record.contracts).length}):`);
  Object.entries(record.contracts).forEach(([name, address]) => {
    console.log(`  • ${name}: ${address}`);
  });
  
  console.log(`\n⚙️ Options:`);
  console.log(`  • Dry Run: ${record.options.dryRun ? '✅' : '❌'}`);
  console.log(`  • Core Only: ${record.options.coreOnly ? '✅' : '❌'}`);
  console.log(`  • Skip Validation: ${record.options.skipValidation ? '✅' : '❌'}`);
}

function main() {
  console.log('🚀 HyperInsure Deployment Status');
  console.log('='.repeat(60));
  
  showDeploymentStatus('testnet');
  showDeploymentStatus('mainnet');
  
  console.log('\n💡 Commands:');
  console.log('  npm run deploy:testnet:dry-run  - Test deployment');
  console.log('  npm run deploy:testnet          - Deploy to testnet');
  console.log('  npm run verify:testnet          - Verify testnet');
  console.log('  npm run deploy:mainnet:dry-run  - Test mainnet deployment');
  console.log('  npm run deploy:mainnet          - Deploy to mainnet');
  console.log('  npm run verify:mainnet          - Verify mainnet');
  console.log('');
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('deployment-status.js')) {
  main();
}

export { loadDeploymentRecord, showDeploymentStatus };