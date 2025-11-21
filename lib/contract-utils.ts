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
  principalCV,
  bufferCV,
  tupleCV,
  listCV,
  ClarityValue,
  cvToString,
  hexToCV,
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
    } catch (error) {
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
      const broadcastResponse = await broadcastTransaction(transaction, this.network);

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
      return result.type === 'bool' && result.value === true;
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
    const proof = tupleCV({
      'tx-index': uintCV(merkleProof.txIndex),
      'hashes': listCV(merkleProof.hashes.map(hash => bufferCV(Buffer.from(hash, 'hex')))),
      'tree-depth': uintCV(merkleProof.treeDepth),
    });

    return this.makeCall('CLAIM_PROCESSOR', 'submit-claim', [
      uintCV(policyId),
      bufferCV(Buffer.from(txHex, 'hex')),
      bufferCV(Buffer.from(blockHeader, 'hex')),
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
export const getTransactionStatus = async (txId: string, network: StacksNetwork) => {
  try {
    const response = await fetch(`${network.coreApiUrl}/extended/v1/tx/${txId}`);
    const txData = await response.json();
    return txData.tx_status;
  } catch (error) {
    console.error('Error getting transaction status:', error);
    return 'unknown';
  }
};