// Quick script to check if policies exist in the contract
// Run with: node test-policy-check.js

const fetch = require('node-fetch');

const STACKS_API = 'https://api.testnet.hiro.so';
const CONTRACT_ADDRESS = 'ST19EWTQXJHNE6QTTSJYET2079J91CM9BRQ8XAH1V';
const CONTRACT_NAME = 'hyperinsure-core-v2';

async function checkPolicy(policyId) {
  try {
    const url = `${STACKS_API}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-policy`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: CONTRACT_ADDRESS,
        arguments: [`0x${Buffer.from(policyId).toString('hex')}`], // string-ascii
      }),
    });

    const result = await response.json();
    console.log(`\nPolicy ${policyId}:`, JSON.stringify(result, null, 2));
    
    if (result.okay === true && result.result) {
      console.log(`✅ Policy ${policyId} exists`);
      return true;
    } else {
      console.log(`❌ Policy ${policyId} not found`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking policy ${policyId}:`, error.message);
    return false;
  }
}

async function checkAdmin() {
  try {
    const url = `${STACKS_API}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-admin`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: CONTRACT_ADDRESS,
        arguments: [],
      }),
    });

    const result = await response.json();
    console.log('\nAdmin address:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error checking admin:', error.message);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('HyperInsure Policy Check');
  console.log('='.repeat(60));
  console.log(`Contract: ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
  console.log(`Network: Testnet`);
  
  // Check admin
  await checkAdmin();
  
  // Check default policies
  const policyIds = ['POL-001', 'POL-002', 'POL-003'];
  
  console.log('\n' + '='.repeat(60));
  console.log('Checking Policies:');
  console.log('='.repeat(60));
  
  for (const policyId of policyIds) {
    await checkPolicy(policyId);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Done!');
  console.log('='.repeat(60));
}

main().catch(console.error);
