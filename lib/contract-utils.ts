/**
 * Contract Interaction Utilities for HyperInsure
 * 
 * This file contains utility functions for interacting with
 * deployed insurance contracts on Stacks blockchain.
 */

import {
  callReadOnlyFunction,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  bufferCV,
  tupleCV,
  listCV,
  ClarityValue,
  cvToString,
  cvToJSON,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { UserSession } from '@stacks/auth';
import { CONTRACT_ADDRESSES, parseContractId, APP_CONFIG } from './stacks-config';

// Types
export interface PolicyData {
  id: number;
  holder: string;
  coverageAmount: number;
  premiumPaid: number;
  startBlock: number;
  endBlock: number;
  status: string;
}

export interface ClaimData {
  id: number;
  policyId: number;
  submitter: string;
  status: string;
  payoutAmount: number;
  submittedAt: number;
}

export interface TreasuryInfo {
  balance: number;
  totalFunded: number;
  totalPaidOut: number;
  reserveRatio: number;
}

// Contract interaction class
export class ContractInteractions {
  constructor(
    private network: StacksNetwork,
    private userSession: UserSession | null = null
  ) {}

  // Helper method to make read-only calls
  private async callReadOnly(
    contractName: keyof typeof CONTRACT_ADDRESSES,
    functionName: string,
    functionArgs: ClarityValue[] = [],
    senderAddress?: string
  ) {
    const contractAddress = CONTRACT_ADDRESSES[contractName];
    if (!contractAddress) {
      throw new Error(`Contract address not found: ${contractName}`);
    }

    const { address, name } = parseContractId(contractAddress);
    
    try {
      if (!this.network) {
        throw new Error('Network not initialized');
      }

      const result = await callReadOnlyFunction({
        contractAddress: address,
        contractName: name,
        functionName,
        functionArgs,
        network: this.network,
        senderAddress: senderAddress || address,
      });

      if (APP_CONFIG.DEBUG_MODE) {
        console.log(`Read-only call ${contractName}.${functionName}:`, cvToString(result));
      }

      return result;
    } catch (error: any) {
      // Handle undefined function errors gracefully
      const errorMessage = error?.message || error?.toString() || '';
      const errorString = JSON.stringify(error) || '';
      
      if (
        errorMessage.includes('UndefinedFunction') || 
        errorMessage.includes('undefined function') ||
        errorString.includes('UndefinedFunction') ||
        errorMessage.includes('get-policy-count') || 
        errorMessage.includes('get-purchase-count') || 
        errorMessage.includes('get-total-deposits') || 
        errorMessage.includes('get-total-payouts')
      ) {
        // Function doesn't exist in contract
        if (APP_CONFIG.DEBUG_MODE) {
          console.warn(`Function ${contractName}.${functionName} does not exist in contract`);
        }
        throw new Error('FUNCTION_NOT_FOUND');
      }
      // Handle network errors gracefully
      if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        console.error(`Network error calling ${contractName}.${functionName}:`, error);
        throw new Error(`Network error: Unable to connect to Stacks API. Please check your connection.`);
      }
      console.error(`Error calling ${contractName}.${functionName}:`, error);
      throw error;
    }
  }

  // Helper method to make contract calls
  private async makeCall(
    contractName: keyof typeof CONTRACT_ADDRESSES,
    functionName: string,
    functionArgs: ClarityValue[] = [],
    postConditions: any[] = []
  ) {
    if (!this.userSession || !this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in to make contract calls');
    }

    const contractAddress = CONTRACT_ADDRESSES[contractName];
    if (!contractAddress) {
      throw new Error(`Contract address not found: ${contractName}`);
    }

    const { address, name } = parseContractId(contractAddress);
    const userData = this.userSession.loadUserData();

    const txOptions = {
      contractAddress: address,
      contractName: name,
      functionName,
      functionArgs,
      senderKey: userData.appPrivateKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      postConditions,
    };

    try {
      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });

      if (APP_CONFIG.DEBUG_MODE) {
        console.log(`Contract call ${contractName}.${functionName}:`, broadcastResponse);
      }

      return broadcastResponse;
    } catch (error) {
      console.error(`Error making contract call ${contractName}.${functionName}:`, error);
      throw error;
    }
  }

  // Policy Manager Functions
  async purchasePolicy(coverageAmount: number, premium: number, duration: number) {
    return this.makeCall('POLICY_MANAGER', 'purchase-policy', [
      uintCV(coverageAmount),
      uintCV(premium),
      uintCV(duration),
    ]);
  }

  async getPolicy(policyId: number): Promise<PolicyData | null> {
    try {
      const result = await this.callReadOnly('POLICY_MANAGER', 'get-policy', [
        uintCV(policyId),
      ]);

      if (result.type === 'none') {
        return null;
      }

      // Parse the policy data from the result
      // This is a simplified version - you'll need to parse the actual tuple structure
      return {
        id: policyId,
        holder: 'ST1...', // Extract from result
        coverageAmount: 0, // Extract from result
        premiumPaid: 0, // Extract from result
        startBlock: 0, // Extract from result
        endBlock: 0, // Extract from result
        status: 'active', // Extract from result
      };
    } catch (error) {
      console.error('Error getting policy:', error);
      return null;
    }
  }

  async isPolicyActive(policyId: number): Promise<boolean> {
    try {
      const result = await this.callReadOnly('POLICY_MANAGER', 'is-policy-active', [
        uintCV(policyId),
      ]);
      // Check if result is a boolean true
      return cvToString(result) === 'true';
    } catch (error) {
      console.error('Error checking policy status:', error);
      return false;
    }
  }

  // Claim Processor Functions
  async submitClaim(
    policyId: number,
    txHex: string,
    blockHeader: string,
    merkleProof: {
      txIndex: number;
      hashes: string[];
      treeDepth: number;
    }
  ) {
    // Helper to convert hex to Uint8Array
    const hexToUint8Array = (hex: string): Uint8Array => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      return bytes;
    };

    const proof = tupleCV({
      'tx-index': uintCV(merkleProof.txIndex),
      'hashes': listCV(merkleProof.hashes.map(hash => bufferCV(hexToUint8Array(hash)))),
      'tree-depth': uintCV(merkleProof.treeDepth),
    });

    return this.makeCall('CLAIM_PROCESSOR', 'submit-claim', [
      uintCV(policyId),
      bufferCV(hexToUint8Array(txHex)),
      bufferCV(hexToUint8Array(blockHeader)),
      proof,
    ]);
  }

  async getClaim(claimId: number): Promise<ClaimData | null> {
    try {
      const result = await this.callReadOnly('CLAIM_PROCESSOR', 'get-claim', [
        uintCV(claimId),
      ]);

      if (result.type === 'none') {
        return null;
      }

      // Parse the claim data from the result
      return {
        id: claimId,
        policyId: 0, // Extract from result
        submitter: 'ST1...', // Extract from result
        status: 'pending', // Extract from result
        payoutAmount: 0, // Extract from result
        submittedAt: 0, // Extract from result
      };
    } catch (error) {
      console.error('Error getting claim:', error);
      return null;
    }
  }

  async verifyAndPayout(claimId: number) {
    return this.makeCall('CLAIM_PROCESSOR', 'verify-and-payout', [
      uintCV(claimId),
    ]);
  }

  // Treasury Functions
  async getTreasuryBalance(): Promise<number> {
    try {
      // Check if contract address is configured
      if (!CONTRACT_ADDRESSES.INSURANCE_TREASURY) {
        console.warn('INSURANCE_TREASURY contract address not configured');
        return 0;
      }
      const result = await this.callReadOnly('INSURANCE_TREASURY', 'get-treasury-balance');
      if (result.type === 'uint') {
        return parseInt(result.value.toString());
      }
      return 0;
    } catch (error) {
      console.error('Error getting treasury balance:', error);
      return 0;
    }
  }

  async getAvailableBalance(): Promise<number> {
    try {
      // Check if contract address is configured
      if (!CONTRACT_ADDRESSES.INSURANCE_TREASURY) {
        console.warn('INSURANCE_TREASURY contract address not configured');
        return 0;
      }
      const result = await this.callReadOnly('INSURANCE_TREASURY', 'get-available-balance');
      if (result.type === 'uint') {
        return parseInt(result.value.toString());
      }
      return 0;
    } catch (error) {
      console.error('Error getting available balance:', error);
      return 0;
    }
  }

  async fundTreasury(amount: number) {
    return this.makeCall('INSURANCE_TREASURY', 'fund-treasury', [
      uintCV(amount),
    ]);
  }

  // Frontend API Functions
  async getPolicyCount(): Promise<number> {
    try {
      const result = await this.callReadOnly('FRONTEND_API', 'get-policy-count');
      if (result.type === 'uint') {
        return parseInt(result.value.toString());
      }
      return 0;
    } catch (error) {
      console.error('Error getting policy count:', error);
      return 0;
    }
  }

  async getClaimCount(): Promise<number> {
    try {
      const result = await this.callReadOnly('FRONTEND_API', 'get-claim-count');
      if (result.type === 'uint') {
        return parseInt(result.value.toString());
      }
      return 0;
    } catch (error) {
      console.error('Error getting claim count:', error);
      return 0;
    }
  }

  async getTreasuryInfo(): Promise<TreasuryInfo> {
    try {
      const result = await this.callReadOnly('FRONTEND_API', 'get-treasury-info');
      
      // Parse treasury info from result
      return {
        balance: 0, // Extract from result
        totalFunded: 0, // Extract from result
        totalPaidOut: 0, // Extract from result
        reserveRatio: 0, // Extract from result
      };
    } catch (error) {
      console.error('Error getting treasury info:', error);
      return {
        balance: 0,
        totalFunded: 0,
        totalPaidOut: 0,
        reserveRatio: 0,
      };
    }
  }

  // HyperInsure Core V2 Functions
  async getPolicyV2(policyId: string): Promise<any | null> {
    try {
      if (!CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2) {
        console.warn('HYPERINSURE_CORE_V2 contract address not configured');
        return null;
      }
      const result = await this.callReadOnly('HYPERINSURE_CORE_V2', 'get-policy', [
        stringAsciiCV(policyId),
      ]);

      if (result.type === 'none' || result.type === 'optionalNone') {
        return null;
      }

      // Handle optional/some wrapper
      let tupleValue = result;
      if (result.type === 'optional' || result.type === 'some') {
        tupleValue = (result as any).value;
      }
      
      // Now extract tuple data directly without cvToJSON
      if (tupleValue && tupleValue.type === 'tuple' && tupleValue.data) {
        const data = tupleValue.data;
        return {
          'name': data.name?.data || data.name,
          'description': data.description?.data || data.description,
          'delay-threshold': data['delay-threshold']?.value || data['delay-threshold'],
          'premium-percentage': data['premium-percentage']?.value || data['premium-percentage'],
          'protocol-fee': data['protocol-fee']?.value || data['protocol-fee'],
          'payout-per-incident': data['payout-per-incident']?.value || data['payout-per-incident'],
          'active': data.active?.value !== undefined ? data.active.value : data.active,
          'created-at': data['created-at']?.value || data['created-at'],
          'created-by': data['created-by']?.data || data['created-by'],
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting policy V2:', error);
      return null;
    }
  }

  async getPurchaseV2(purchaseId: string): Promise<any | null> {
    try {
      if (!CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2) {
        console.warn('HYPERINSURE_CORE_V2 contract address not configured');
        return null;
      }
      const result = await this.callReadOnly('HYPERINSURE_CORE_V2', 'get-purchase', [
        stringAsciiCV(purchaseId),
      ]);

      if (result.type === 'none' || result.type === 'optionalNone') {
        return null;
      }

      // Handle optional/some wrapper
      let tupleValue = result;
      if (result.type === 'optional' || result.type === 'some') {
        tupleValue = (result as any).value;
      }
      
      // Now extract tuple data directly without cvToJSON
      if (tupleValue && tupleValue.type === 'tuple' && tupleValue.data) {
        const data = tupleValue.data;
        return {
          'policy-id': data['policy-id']?.data || data['policy-id'],
          'purchaser': data.purchaser?.data || data.purchaser,
          'stx-amount': data['stx-amount']?.value || data['stx-amount'],
          'premium-paid': data['premium-paid']?.value || data['premium-paid'],
          'fee-paid': data['fee-paid']?.value || data['fee-paid'],
          'active': data.active?.value !== undefined ? data.active.value : data.active,
          'created-at': data['created-at']?.value || data['created-at'],
          'expiry': data.expiry?.value || data.expiry,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting purchase V2:', error);
      return null;
    }
  }

  async getPolicyCountV2(): Promise<number> {
    try {
      if (!CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2) {
        return 0;
      }
      // Try to get policy-count variable (if there's a read-only function)
      try {
        const result = await this.callReadOnly('HYPERINSURE_CORE_V2', 'get-policy-count', []);
        if (result.type === 'uint') {
          return parseInt(result.value.toString());
        }
      } catch (e: any) {
        // Function doesn't exist in contract - calculate from known policies
        if (e?.message === 'FUNCTION_NOT_FOUND') {
          // Try to count from known policy IDs
          const knownIds = ['POL-001', 'POL-002', 'POL-003']
          let count = 0
          for (const id of knownIds) {
            try {
              const policy = await this.getPolicyV2(id)
              if (policy) count++
            } catch {
              // Policy doesn't exist
            }
          }
          // Also check localStorage for created policies
          if (typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem('hyperinsure_created_policies')
              const createdIds: string[] = stored ? JSON.parse(stored) : []
              count = Math.max(count, createdIds.length)
            } catch {
              // Ignore localStorage errors
            }
          }
          return count
        }
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async getPurchaseCountV2(): Promise<number> {
    try {
      if (!CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2) {
        return 0;
      }
      try {
        const result = await this.callReadOnly('HYPERINSURE_CORE_V2', 'get-purchase-count', []);
        if (result.type === 'uint') {
          return parseInt(result.value.toString());
        }
      } catch (e: any) {
        // Function doesn't exist - count from localStorage
        if (e?.message === 'FUNCTION_NOT_FOUND') {
          if (typeof window !== 'undefined') {
            try {
              // Count all purchases from all users in localStorage
              let totalPurchases = 0
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key?.startsWith('hyperinsure_purchases_')) {
                  try {
                    const purchases = JSON.parse(localStorage.getItem(key) || '[]')
                    totalPurchases += purchases.length
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
              return totalPurchases
            } catch {
              return 0
            }
          }
        }
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async getTotalDepositsV2(): Promise<number> {
    try {
      if (!CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2) {
        return 0;
      }
      try {
        const result = await this.callReadOnly('HYPERINSURE_CORE_V2', 'get-total-deposits', []);
        if (result.type === 'uint') {
          return parseInt(result.value.toString()) / 1000000; // Convert microSTX to STX
        }
      } catch (e: any) {
        // Function doesn't exist - return 0 (can't calculate without contract function)
        if (e?.message === 'FUNCTION_NOT_FOUND') {
          return 0;
        }
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async getTotalPayoutsV2(): Promise<number> {
    try {
      if (!CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2) {
        return 0;
      }
      try {
        const result = await this.callReadOnly('HYPERINSURE_CORE_V2', 'get-total-payouts', []);
        if (result.type === 'uint') {
          return parseInt(result.value.toString()) / 1000000; // Convert microSTX to STX
        }
      } catch (e: any) {
        // Function doesn't exist - return 0 (can't calculate without contract function)
        if (e?.message === 'FUNCTION_NOT_FOUND') {
          return 0;
        }
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Utility Functions
  async getContractInfo(contractName: keyof typeof CONTRACT_ADDRESSES) {
    const contractAddress = CONTRACT_ADDRESSES[contractName];
    if (!contractAddress) {
      throw new Error(`Contract address not found: ${contractName}`);
    }

    const { address, name } = parseContractId(contractAddress);
    
    try {
      // Get contract source and interface
      const response = await fetch(`${APP_CONFIG.STACKS_API_URL}/v1/contracts/${address}/${name}`);
      const contractInfo = await response.json();
      
      return contractInfo;
    } catch (error) {
      console.error(`Error getting contract info for ${contractName}:`, error);
      throw error;
    }
  }

  async getAdminV2(): Promise<string | null> {
    try {
      if (!CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2) {
        console.warn('HYPERINSURE_CORE_V2 contract address not configured');
        return null;
      }
      
      try {
        const result = await this.callReadOnly('HYPERINSURE_CORE_V2', 'get-admin', []);
        
        // Try to extract the principal address from the result
        // The result might be wrapped or have different type codes
        let adminAddress: string | null = null;
        
        // First, try cvToString which should work for principal types
        const resultString = cvToString(result);
        if (APP_CONFIG.DEBUG_MODE) {
          console.log('get-admin result string:', resultString);
          console.log('get-admin result type:', result.type);
          console.log('get-admin result:', result);
        }
        
        // Check if the string contains a Stacks address (ST or SP prefix)
        if (resultString && (resultString.startsWith('ST') || resultString.startsWith('SP'))) {
          adminAddress = resultString;
        } else if (result.type === 'principal') {
          // Direct principal type
          adminAddress = cvToString(result);
        } else if ((result as any).value) {
          // Try to extract from value property
          const value = (result as any).value;
          if (typeof value === 'string' && (value.startsWith('ST') || value.startsWith('SP'))) {
            adminAddress = value;
          } else {
            adminAddress = cvToString(value);
          }
        }
        
        if (adminAddress && (adminAddress.startsWith('ST') || adminAddress.startsWith('SP'))) {
          if (APP_CONFIG.DEBUG_MODE) {
            console.log('Admin address fetched successfully:', adminAddress);
          }
          return adminAddress;
        }
        
        console.warn('get-admin returned unexpected format. Result:', resultString, 'Type:', result.type);
        return null;
      } catch (readError: any) {
        // Check if it's a function not found error
        if (readError?.message === 'FUNCTION_NOT_FOUND') {
          console.warn('get-admin function not found in contract');
          return null;
        }
        // Re-throw other errors
        throw readError;
      }
    } catch (error: any) {
      console.error('Error getting admin V2:', error);
      // Log more details about the error
      if (error?.message) {
        console.error('Error message:', error.message);
      }
      if (error?.stack) {
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  }
}

// Helper function to format STX amounts
export const formatSTX = (microSTX: number): string => {
  return (microSTX / 1000000).toFixed(6) + ' STX';
};

// Helper function to parse STX amounts
export const parseSTX = (stxAmount: string): number => {
  return Math.floor(parseFloat(stxAmount) * 1000000);
};

// Helper function to format addresses
export const formatAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to get transaction status
export const getTransactionStatus = async (txId: string, _network: StacksNetwork) => {
  try {
    const response = await fetch(`${APP_CONFIG.STACKS_API_URL}/extended/v1/tx/${txId}`);
    const txData = await response.json();
    return txData.tx_status;
  } catch (error) {
    console.error('Error getting transaction status:', error);
    return 'unknown';
  }
};