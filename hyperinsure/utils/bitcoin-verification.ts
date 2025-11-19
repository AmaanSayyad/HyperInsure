/**
 * Bitcoin Verification Utilities for HyperInsure V2
 * 
 * This module provides utilities to fetch real Bitcoin transaction data
 * and prepare it for trustless verification using clarity-bitcoin-lib-v5
 */

import {
  callReadOnlyFunction,
  bufferCV,
  uintCV,
  tupleCV,
  listCV,
  cvToString,
  ClarityValue,
} from "@stacks/transactions";
import { StacksMainnet } from "@stacks/network";
import { hexToBytes } from "@stacks/common";

// Bitcoin data fetching functions (from btc-tx-data.js)
export interface BitcoinTxData {
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

/**
 * Fetch Bitcoin transaction hex from mempool.space
 */
export async function getTxHex(txid: string): Promise<string> {
  const response = await fetch(`https://mempool.space/api/tx/${txid}/hex`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transaction: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Fetch Bitcoin transaction merkle proof
 */
export async function getTxMerkleProof(txid: string) {
  const response = await fetch(`https://mempool.space/api/tx/${txid}/merkle-proof`);
  if (!response.ok) {
    throw new Error(`Failed to fetch merkle proof: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch Bitcoin block header
 */
export async function getBlockHeader(blockHash: string): Promise<string> {
  const response = await fetch(`https://mempool.space/api/block/${blockHash}/header`);
  if (!response.ok) {
    throw new Error(`Failed to fetch block header: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Fetch block hash by height
 */
export async function getBlockHashByHeight(height: number): Promise<string> {
  const response = await fetch(`https://mempool.space/api/block-height/${height}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch block hash: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Remove witness data from transaction hex
 * Required for clarity-bitcoin-lib-v5 verification
 */
export function removeWitnessData(txHex: string): string {
  // This is a simplified version
  // In production, use bitcoinjs-lib Transaction.fromHex() and rebuild without witnesses
  // For now, return as-is (assuming non-witness tx)
  return txHex;
}

/**
 * Fetch complete Bitcoin transaction data for verification
 */
export async function getBitcoinTxDataForVerification(txid: string): Promise<BitcoinTxData> {
  // Fetch transaction hex
  const fullTxHex = await getTxHex(txid);
  const txHex = removeWitnessData(fullTxHex);

  // Fetch merkle proof
  const { block_height, merkle, pos } = await getTxMerkleProof(txid);

  // Fetch block header
  const blockHash = await getBlockHashByHeight(block_height);
  const blockHeader = await getBlockHeader(blockHash);

  return {
    txid,
    txHex,
    blockHeight: block_height,
    blockHeader,
    merkleProof: {
      pos,
      merkle,
      treeDepth: merkle.length,
    },
  };
}

/**
 * Verify Bitcoin transaction using clarity-bitcoin-lib-v5 on mainnet
 * 
 * This function calls the deployed clarity-bitcoin-lib-v5 contract
 * to verify that a Bitcoin transaction was mined in a specific block
 */
export async function verifyBitcoinTransaction(
  txid: string,
  senderAddress: string
): Promise<{ success: boolean; result: string }> {
  const mainnet = new StacksMainnet();

  // Clarity-bitcoin-lib-v5 contract on mainnet
  const contractAddress = "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
  const contractName = "clarity-bitcoin-lib-v5";
  const functionName = "was-tx-mined-compact";

  // Fetch Bitcoin transaction data
  const txData = await getBitcoinTxDataForVerification(txid);

  // Prepare merkle proof hashes (reverse byte order for Clarity)
  const hashes = txData.merkleProof.merkle.map((hash) =>
    bufferCV(hexToBytes(hash).reverse())
  );

  // Prepare function arguments
  const functionArgs = [
    // (height uint)
    uintCV(txData.blockHeight),
    // (tx (buff 1024))
    bufferCV(Buffer.from(txData.txHex, "hex")),
    // (header (buff 80))
    bufferCV(Buffer.from(txData.blockHeader, "hex")),
    // (proof { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint })
    tupleCV({
      "tx-index": uintCV(txData.merkleProof.pos),
      hashes: listCV(hashes),
      "tree-depth": uintCV(txData.merkleProof.treeDepth),
    }),
  ];

  // Call clarity-bitcoin-lib-v5
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    network: mainnet,
    senderAddress,
  });

  const resultString = cvToString(result);

  return {
    success: resultString.startsWith("(ok"),
    result: resultString,
  };
}

/**
 * Prepare Bitcoin proof data for Clarity contract call
 * 
 * This function prepares the data structure needed for submit-claim-with-proof
 */
export function prepareBitcoinProofForClaim(txData: BitcoinTxData) {
  return {
    txHash: Buffer.from(txData.txid, "hex"),
    tx: Buffer.from(txData.txHex, "hex"),
    header: Buffer.from(txData.blockHeader, "hex"),
    proof: {
      "tx-index": txData.merkleProof.pos,
      hashes: txData.merkleProof.merkle.map((hash) =>
        Buffer.from(hexToBytes(hash).reverse())
      ),
      "tree-depth": txData.merkleProof.treeDepth,
    },
  };
}

/**
 * Example usage:
 * 
 * ```typescript
 * // Fetch and verify a Bitcoin transaction
 * const txid = "819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461";
 * const senderAddress = "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
 * 
 * const { success, result } = await verifyBitcoinTransaction(txid, senderAddress);
 * console.log("Verification result:", result);
 * 
 * // Prepare data for claim submission
 * const txData = await getBitcoinTxDataForVerification(txid);
 * const proofData = prepareBitcoinProofForClaim(txData);
 * 
 * // Submit claim with proof
 * await submitClaimWithProof(
 *   claimId,
 *   purchaseId,
 *   proofData.txHash,
 *   broadcastHeight,
 *   txData.blockHeight,
 *   proofData.tx,
 *   proofData.header,
 *   proofData.proof
 * );
 * ```
 */
