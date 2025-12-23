/**
 * Stacks Network Configuration for HyperInsure
 * 
 * This file contains the configuration for connecting to Stacks blockchain
 * and interacting with deployed insurance contracts.
 */

import { StacksTestnet, StacksMainnet } from '@stacks/network';

// Environment variables with fallbacks
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const STACKS_API_URL = process.env.NEXT_PUBLIC_STACKS_API_URL || 'https://api.testnet.hiro.so';

// Network configuration
export const getStacksNetwork = () => {
  if (NETWORK === 'mainnet') {
    return new StacksMainnet({ url: 'https://api.hiro.so' });
  }
  return new StacksTestnet({ url: STACKS_API_URL });
};

// Contract addresses from environment
export const CONTRACT_ADDRESSES = {
  // Core Insurance Contracts
  CLARITY_BITCOIN: process.env.NEXT_PUBLIC_CLARITY_BITCOIN_CONTRACT || '',
  INSURANCE_TREASURY: process.env.NEXT_PUBLIC_INSURANCE_TREASURY_CONTRACT || '',
  POLICY_MANAGER: process.env.NEXT_PUBLIC_POLICY_MANAGER_CONTRACT || '',
  CLAIM_PROCESSOR: process.env.NEXT_PUBLIC_CLAIM_PROCESSOR_CONTRACT || '',
  
  // Enhanced Contracts
  HYPERINSURE_CORE_V2: process.env.NEXT_PUBLIC_HYPERINSURE_CORE_V2_CONTRACT || '',
  FRONTEND_API: process.env.NEXT_PUBLIC_FRONTEND_API_CONTRACT || '',
  
  // Governance and Oracle
  GOVERNANCE: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT || '',
  ORACLE: process.env.NEXT_PUBLIC_ORACLE_CONTRACT || '',
  
  // Legacy
  HYPERINSURE_CORE: process.env.NEXT_PUBLIC_HYPERINSURE_CORE_CONTRACT || '',
} as const;

// Deployer address
export const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '';

// Application settings
export const APP_CONFIG = {
  NETWORK,
  STACKS_API_URL,
  EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://explorer.hiro.so',
  BITCOIN_API_URL: process.env.NEXT_PUBLIC_BITCOIN_API_URL || 'https://mempool.space/testnet/api',
  
  // Policy defaults
  DEFAULT_DELAY_THRESHOLD: parseInt(process.env.NEXT_PUBLIC_DEFAULT_DELAY_THRESHOLD || '35'),
  DEFAULT_POLICY_DURATION: parseInt(process.env.NEXT_PUBLIC_DEFAULT_POLICY_DURATION || '1000'),
  MIN_PREMIUM_AMOUNT: parseInt(process.env.NEXT_PUBLIC_MIN_PREMIUM_AMOUNT || '100000'),
  MAX_COVERAGE_AMOUNT: parseInt(process.env.NEXT_PUBLIC_MAX_COVERAGE_AMOUNT || '100000000000'),
  
  // Debug settings
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  ENABLE_CONSOLE_LOGS: process.env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGS === 'true',
} as const;

// Bitcoin integration
export const BITCOIN_CONFIG = {
  NETWORK: process.env.NEXT_PUBLIC_BITCOIN_NETWORK || 'testnet',
  MEMPOOL_API_URL: process.env.NEXT_PUBLIC_MEMPOOL_API_URL || 'https://mempool.space/testnet/api',
  CLARITY_BITCOIN_MAINNET: process.env.NEXT_PUBLIC_CLARITY_BITCOIN_MAINNET || 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.clarity-bitcoin-lib-v5',
} as const;

// Validate configuration
export const validateConfig = () => {
  const missingContracts = Object.entries(CONTRACT_ADDRESSES)
    .filter(([_, address]) => !address)
    .map(([name]) => name);
  
  if (missingContracts.length > 0) {
    console.warn('Missing contract addresses:', missingContracts);
  }
  
  if (!DEPLOYER_ADDRESS) {
    console.warn('Missing deployer address');
  }
  
  return {
    isValid: missingContracts.length === 0 && !!DEPLOYER_ADDRESS,
    missingContracts,
    hasDeployerAddress: !!DEPLOYER_ADDRESS,
  };
};

// Helper function to get contract address with validation
export const getContractAddress = (contractName: keyof typeof CONTRACT_ADDRESSES): string => {
  const address = CONTRACT_ADDRESSES[contractName];
  if (!address) {
    throw new Error(`Contract address not found for: ${contractName}`);
  }
  return address;
};

// Helper function to parse contract identifier
export const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

// Export network instance
export const network = getStacksNetwork();