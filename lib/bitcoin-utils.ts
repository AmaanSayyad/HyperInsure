/**
 * Bitcoin Utilities for HyperInsure Frontend
 * 
 * This file contains utilities for fetching Bitcoin transaction data
 * and preparing it for insurance claim verification.
 */

import { BITCOIN_CONFIG, APP_CONFIG } from './stacks-config';

// Types
export interface BitcoinTransaction {
  txid: string;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

export interface MerkleProof {
  block_height: number;
  merkle: string[];
  pos: number;
}

export interface BitcoinBlock {
  id: string;
  height: number;
  version: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  merkle_root: string;
  previousblockhash: string;
  mediantime: number;
  nonce: number;
  bits: number;
  difficulty: number;
}

export interface BitcoinProofData {
  txid: string;
  txHex: string;
  blockHeight: number;
  blockHeader: string;
  merkleProof: {
    pos: number;
    merkle: string[];
    treeDepth: number;
  };
}

// Bitcoin API client
export class BitcoinAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BITCOIN_CONFIG.MEMPOOL_API_URL;
  }

  // Fetch transaction data
  async getTransaction(txid: string): Promise<BitcoinTransaction> {
    try {
      const response = await fetch(`${this.baseUrl}/tx/${txid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  // Fetch transaction hex
  async getTransactionHex(txid: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/tx/${txid}/hex`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transaction hex: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching transaction hex:', error);
      throw error;
    }
  }

  // Fetch merkle proof
  async getMerkleProof(txid: string): Promise<MerkleProof> {
    try {
      const response = await fetch(`${this.baseUrl}/tx/${txid}/merkle-proof`);
      if (!response.ok) {
        throw new Error(`Failed to fetch merkle proof: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching merkle proof:', error);
      throw error;
    }
  }

  // Fetch block header
  async getBlockHeader(blockHash: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/block/${blockHash}/header`);
      if (!response.ok) {
        throw new Error(`Failed to fetch block header: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching block header:', error);
      throw error;
    }
  }

  // Fetch block data
  async getBlock(blockHash: string): Promise<BitcoinBlock> {
    try {
      const response = await fetch(`${this.baseUrl}/block/${blockHash}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch block: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching block:', error);
      throw error;
    }
  }

  // Get block hash by height
  async getBlockHashByHeight(height: number): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/block-height/${height}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch block hash: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching block hash:', error);
      throw error;
    }
  }

  // Get current block height
  async getCurrentBlockHeight(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/blocks/tip/height`);
      if (!response.ok) {
        throw new Error(`Failed to fetch current block height: ${response.statusText}`);
      }
      return parseInt(await response.text());
    } catch (error) {
      console.error('Error fetching current block height:', error);
      throw error;
    }
  }

  // Calculate transaction delay
  async calculateTransactionDelay(txid: string, estimatedBroadcastHeight?: number): Promise<{
    broadcastHeight: number;
    confirmationHeight: number;
    delay: number;
    isDelayed: boolean;
    threshold: number;
  }> {
    try {
      const tx = await this.getTransaction(txid);
      
      if (!tx.status.confirmed || !tx.status.block_height) {
        throw new Error('Transaction is not confirmed');
      }

      const confirmationHeight = tx.status.block_height;
      const broadcastHeight = estimatedBroadcastHeight || (confirmationHeight - 1);
      const delay = confirmationHeight - broadcastHeight;
      const threshold = APP_CONFIG.DEFAULT_DELAY_THRESHOLD;

      return {
        broadcastHeight,
        confirmationHeight,
        delay,
        isDelayed: delay > threshold,
        threshold,
      };
    } catch (error) {
      console.error('Error calculating transaction delay:', error);
      throw error;
    }
  }

  // Get complete proof data for claim submission
  async getCompleteProofData(txid: string): Promise<BitcoinProofData> {
    try {
      // Fetch all required data
      const [txHex, merkleProof] = await Promise.all([
        this.getTransactionHex(txid),
        this.getMerkleProof(txid),
      ]);

      // Get block header
      const blockHash = await this.getBlockHashByHeight(merkleProof.block_height);
      const blockHeader = await this.getBlockHeader(blockHash);

      // Remove witness data if present (for SegWit transactions)
      const cleanTxHex = this.removeWitnessData(txHex);

      return {
        txid,
        txHex: cleanTxHex,
        blockHeight: merkleProof.block_height,
        blockHeader,
        merkleProof: {
          pos: merkleProof.pos,
          merkle: merkleProof.merkle,
          treeDepth: merkleProof.merkle.length,
        },
      };
    } catch (error) {
      console.error('Error getting complete proof data:', error);
      throw error;
    }
  }

  // Remove witness data from SegWit transactions
  private removeWitnessData(txHex: string): string {
    // This is a simplified version - you may want to use the full implementation
    // from the hyperinsure/utils/bitcoin-verification.ts file
    
    const txBuffer = Buffer.from(txHex, 'hex');
    
    // Check for SegWit marker (0x00) and flag (0x01) after version
    if (txBuffer.length > 6 && txBuffer[4] === 0x00 && txBuffer[5] === 0x01) {
      // This is a SegWit transaction - implement proper witness data removal
      // For now, return as-is (you should implement the full logic)
      console.warn('SegWit transaction detected - witness data removal not fully implemented');
    }
    
    return txHex;
  }
}

// Utility functions
export const formatTxId = (txid: string): string => {
  if (txid.length <= 16) return txid;
  return `${txid.slice(0, 8)}...${txid.slice(-8)}`;
};

export const formatBlockHeight = (height: number): string => {
  return height.toLocaleString();
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatSats = (sats: number): string => {
  return (sats / 100000000).toFixed(8) + ' BTC';
};

// Validation functions
export const isValidTxId = (txid: string): boolean => {
  return /^[a-fA-F0-9]{64}$/.test(txid);
};

export const isValidBlockHash = (hash: string): boolean => {
  return /^[a-fA-F0-9]{64}$/.test(hash);
};

export const isValidBlockHeight = (height: number): boolean => {
  return Number.isInteger(height) && height > 0 && height < 1000000; // Reasonable bounds
};

// Create Bitcoin API instance
export const bitcoinAPI = new BitcoinAPI();

// Export commonly used functions
export {
  BitcoinAPI,
};