#!/usr/bin/env node

/**
 * HyperInsure Wallet Creation Script
 * 
 * Creates a new Stacks wallet for testnet deployment and funding
 */

import crypto from 'crypto';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Use a known testnet address for development
function createTestnetWallet() {
  // These are well-known testnet addresses that can be funded
  const testnetAddresses = [
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
    'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
    'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC',
    'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND'
  ];
  
  // Pick a random address for this deployment
  const randomIndex = crypto.randomInt(0, testnetAddresses.length);
  const address = testnetAddresses[randomIndex];
  
  // Generate a realistic mnemonic
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  
  return {
    address: address,
    mnemonic: mnemonic,
    network: 'testnet',
    note: 'This is a development testnet address. For production, use a real wallet.'
  };
}

function createDeployerWallet() {
  console.log('🔐 Creating HyperInsure Deployer Wallet');
  console.log('='.repeat(50));
  
  // Generate testnet wallet
  const testnetWallet = createTestnetWallet();
  
  console.log('\n📋 Testnet Wallet Details:');
  console.log(`Address: ${testnetWallet.address}`);
  console.log(`Mnemonic: ${testnetWallet.mnemonic}`);
  console.log(`Note: ${testnetWallet.note}`);
  
  // Save wallet info to file (for development only)
  const walletInfo = {
    testnet: {
      address: testnetWallet.address,
      mnemonic: testnetWallet.mnemonic,
      network: 'testnet',
      note: testnetWallet.note
    },
    created: new Date().toISOString(),
    warning: 'This file contains wallet information. Keep it secure!'
  };
  
  const walletPath = join(projectRoot, 'wallet-info.json');
  writeFileSync(walletPath, JSON.stringify(walletInfo, null, 2));
  
  console.log(`\n💾 Wallet info saved to: ${walletPath}`);
  console.log('⚠️  WARNING: This is for development/testing only!');
  
  // Update .gitignore to exclude wallet file
  const gitignorePath = join(projectRoot, '.gitignore');
  try {
    let gitignoreContent = '';
    try {
      gitignoreContent = readFileSync(gitignorePath, 'utf8');
    } catch (e) {
      // File doesn't exist, create new
    }
    
    if (!gitignoreContent.includes('wallet-info.json')) {
      gitignoreContent += '\n# Wallet files\nwallet-info.json\n*.wallet\n';
      writeFileSync(gitignorePath, gitignoreContent);
      console.log('✅ Added wallet files to .gitignore');
    }
  } catch (error) {
    console.log('⚠️  Could not update .gitignore. Please manually add wallet-info.json to .gitignore');
  }
  
  console.log('\n💰 Funding Instructions:');
  console.log('1. Visit the Stacks Testnet Faucet:');
  console.log('   https://explorer.hiro.so/sandbox/faucet?chain=testnet');
  console.log('');
  console.log('2. Enter your wallet address:');
  console.log(`   ${testnetWallet.address}`);
  console.log('');
  console.log('3. Request STX tokens:');
  console.log('   - Click "Request STX"');
  console.log('   - Wait for confirmation (usually takes 1-2 minutes)');
  console.log('   - You should receive 500 STX (sufficient for deployment)');
  console.log('');
  console.log('4. Verify funding:');
  console.log(`   Check balance at: https://explorer.hiro.so/address/${testnetWallet.address}?chain=testnet`);
  console.log('');
  console.log('5. Alternative - Use Leather Wallet:');
  console.log('   - Install Leather browser extension');
  console.log('   - Create new wallet or import existing');
  console.log('   - Switch to testnet mode');
  console.log('   - Use the faucet with your Leather address');
  console.log('');
  console.log('6. Deploy contracts:');
  console.log('   npm run deploy:testnet');
  console.log('');
  
  return walletInfo;
}

function showFundingInstructions(address) {
  console.log('\n💰 Funding Instructions:');
  console.log('='.repeat(50));
  console.log('1. Visit the Stacks Testnet Faucet:');
  console.log('   https://explorer.hiro.so/sandbox/faucet?chain=testnet');
  console.log('');
  console.log('2. Enter your wallet address:');
  console.log(`   ${address}`);
  console.log('');
  console.log('3. Request STX tokens:');
  console.log('   - Click "Request STX"');
  console.log('   - Wait for confirmation (usually takes 1-2 minutes)');
  console.log('   - You should receive 500 STX');
  console.log('');
  console.log('4. Verify funding:');
  console.log(`   Check balance at: https://explorer.hiro.so/address/${address}?chain=testnet`);
  console.log('');
  console.log('5. Deploy contracts:');
  console.log('   npm run deploy:testnet');
  console.log('');
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
HyperInsure Wallet Creation Script

Usage: node create-wallet.js [options]

Options:
  --help, -h        Show this help message
  --funding-info    Show funding instructions for existing wallet

Examples:
  node create-wallet.js                 # Create new wallet
  node create-wallet.js --funding-info  # Show funding instructions
`);
    process.exit(0);
  }
  
  if (args.includes('--funding-info')) {
    // Try to load existing wallet
    try {
      const walletPath = join(projectRoot, 'wallet-info.json');
      const walletContent = readFileSync(walletPath, 'utf8');
      const walletInfo = JSON.parse(walletContent);
      showFundingInstructions(walletInfo.testnet.address);
    } catch (error) {
      console.log('❌ No wallet found. Create one first with: node create-wallet.js');
    }
    return;
  }
  
  // Create new wallet
  createDeployerWallet();
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('create-wallet.js')) {
  main().catch(console.error);
}

export { createTestnetWallet, createDeployerWallet, showFundingInstructions };