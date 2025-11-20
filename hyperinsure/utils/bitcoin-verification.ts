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
import { createHash } from "crypto";

// ============================================================================
// Data Formatting Utilities
// ============================================================================

/**
 * Convert a hex string to a Buffer
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Buffer containing the bytes
 */
export function hexToBuffer(hex: string): Buffer {
  if (!hex || hex.length === 0) {
    return Buffer.alloc(0);
  }
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  return Buffer.from(cleanHex, "hex");
}

/**
 * Convert a Buffer to a hex string
 * @param buffer - Buffer to convert
 * @returns Hex string (lowercase, no 0x prefix)
 */
export function bufferToHex(buffer: Buffer): string {
  if (!buffer || buffer.length === 0) {
    return "";
  }
  return buffer.toString("hex");
}

/**
 * Reverse the byte order of a hex string
 * Used for converting between Bitcoin's little-endian and big-endian formats
 * @param hexString - Hex string to reverse (must be even length)
 * @returns Buffer with reversed byte order
 */
export function reverseBytes(hexString: string): Buffer {
  if (!hexString || hexString.length === 0) {
    return Buffer.alloc(0);
  }
  // Remove 0x prefix if present
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  
  // Convert to buffer and reverse
  const buffer = Buffer.from(cleanHex, "hex");
  return Buffer.from(buffer.reverse());
}

/**
 * Compute double-SHA256 hash of data (SHA256(SHA256(data)))
 * This is the standard Bitcoin transaction hashing algorithm
 * @param data - Buffer or hex string to hash
 * @returns Buffer containing the 32-byte double-SHA256 hash
 */
export function doubleSha256(data: Buffer | string): Buffer {
  const buffer = typeof data === "string" 
    ? Buffer.from(data.startsWith("0x") ? data.slice(2) : data, "hex")
    : data;
  
  const firstHash = createHash("sha256").update(buffer).digest();
  const secondHash = createHash("sha256").update(firstHash).digest();
  
  return secondHash;
}

/**
 * Compute the Bitcoin transaction ID (txid) from a non-witness transaction hex
 * The txid is the reversed double-SHA256 hash of the transaction
 * @param txHex - Non-witness transaction hex string
 * @returns The transaction ID as a hex string (reversed byte order)
 */
export function computeTxid(txHex: string): string {
  const hash = doubleSha256(txHex);
  // Bitcoin txids are displayed in reversed byte order
  return Buffer.from(hash).reverse().toString("hex");
}

/**
 * Raw merkle proof structure from mempool.space API
 */
export interface RawMerkleProof {
  block_height: number;
  pos: number;
  merkle: string[];
}

/**
 * Merkle proof formatted for Clarity contract calls
 */
export interface MerkleProofForClarity {
  "tx-index": number;
  hashes: Buffer[];
  "tree-depth": number;
}

/**
 * Format a raw merkle proof for Clarity contract compatibility
 * - Reverses byte order of each hash (Bitcoin uses little-endian, Clarity expects big-endian)
 * - Creates proper tuple structure with tx-index, hashes, tree-depth
 * @param proof - Raw merkle proof from mempool.space API
 * @returns Formatted merkle proof for Clarity
 */
export function formatMerkleProofForClarity(proof: RawMerkleProof): MerkleProofForClarity {
  return {
    "tx-index": proof.pos,
    hashes: proof.merkle.map((hash) => reverseBytes(hash)),
    "tree-depth": proof.merkle.length,
  };
}

// ============================================================================
// Bitcoin Data Fetching Functions
// ============================================================================

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
 * Read a variable-length integer (varint) from a buffer at a given offset
 * Returns the value and the number of bytes consumed
 * @param buffer - Buffer to read from
 * @param offset - Starting offset
 * @returns Object with value and size (bytes consumed)
 */
function readVarInt(buffer: Buffer, offset: number): { value: number; size: number } {
  const first = buffer[offset];
  
  if (first < 0xfd) {
    return { value: first, size: 1 };
  } else if (first === 0xfd) {
    return { value: buffer.readUInt16LE(offset + 1), size: 3 };
  } else if (first === 0xfe) {
    return { value: buffer.readUInt32LE(offset + 1), size: 5 };
  } else {
    // 0xff - 8 byte integer (we'll use Number which may lose precision for very large values)
    const low = buffer.readUInt32LE(offset + 1);
    const high = buffer.readUInt32LE(offset + 5);
    return { value: high * 0x100000000 + low, size: 9 };
  }
}

/**
 * Remove witness data from a SegWit transaction hex
 * Required for clarity-bitcoin-lib-v5 verification which expects non-witness format
 * 
 * SegWit transaction format:
 * - Version (4 bytes)
 * - Marker (1 byte: 0x00)
 * - Flag (1 byte: 0x01)
 * - Input count (varint)
 * - Inputs
 * - Output count (varint)
 * - Outputs
 * - Witness data (for each input)
 * - Locktime (4 bytes)
 * 
 * Non-witness format removes marker, flag, and witness data
 * 
 * @param txHex - Transaction hex string (with or without 0x prefix)
 * @returns Non-witness transaction hex string
 */
export function removeWitnessData(txHex: string): string {
  // Remove 0x prefix if present
  const cleanHex = txHex.startsWith("0x") ? txHex.slice(2) : txHex;
  
  // Convert to buffer for easier manipulation
  const txBuffer = Buffer.from(cleanHex, "hex");
  
  // Check minimum length (version + marker + flag + at least some data + locktime)
  if (txBuffer.length < 10) {
    return cleanHex;
  }
  
  // Check for segwit marker (0x00) and flag (0x01) after version (4 bytes)
  const marker = txBuffer[4];
  const flag = txBuffer[5];
  
  // If not a segwit transaction (no marker/flag), return original
  if (marker !== 0x00 || flag !== 0x01) {
    return cleanHex;
  }
  
  // This is a segwit transaction - strip witness data
  // Build non-witness transaction:
  // 1. Version (4 bytes)
  // 2. Input count + inputs (skip marker and flag)
  // 3. Output count + outputs
  // 4. Locktime (4 bytes)
  
  const result: Buffer[] = [];
  
  // 1. Copy version (4 bytes)
  result.push(txBuffer.subarray(0, 4));
  
  // 2. Parse inputs (starting after marker and flag at offset 6)
  let offset = 6;
  
  // Read input count
  const inputCountResult = readVarInt(txBuffer, offset);
  const inputCount = inputCountResult.value;
  
  // Mark start of input section (including count)
  const inputSectionStart = offset;
  offset += inputCountResult.size;
  
  // Skip through all inputs
  for (let i = 0; i < inputCount; i++) {
    // Previous output hash (32 bytes)
    offset += 32;
    // Previous output index (4 bytes)
    offset += 4;
    // Script length (varint)
    const scriptLenResult = readVarInt(txBuffer, offset);
    offset += scriptLenResult.size;
    // Script
    offset += scriptLenResult.value;
    // Sequence (4 bytes)
    offset += 4;
  }
  
  // Mark end of inputs section
  const inputSectionEnd = offset;
  
  // 3. Parse outputs
  const outputSectionStart = offset;
  
  // Read output count
  const outputCountResult = readVarInt(txBuffer, offset);
  const outputCount = outputCountResult.value;
  offset += outputCountResult.size;
  
  // Skip through all outputs
  for (let i = 0; i < outputCount; i++) {
    // Value (8 bytes)
    offset += 8;
    // Script length (varint)
    const scriptLenResult = readVarInt(txBuffer, offset);
    offset += scriptLenResult.size;
    // Script
    offset += scriptLenResult.value;
  }
  
  // Mark end of outputs section
  const outputSectionEnd = offset;
  
  // 2. Copy input section (count + all inputs)
  result.push(txBuffer.subarray(inputSectionStart, inputSectionEnd));
  
  // 3. Copy output section (count + all outputs)
  result.push(txBuffer.subarray(outputSectionStart, outputSectionEnd));
  
  // 4. Copy locktime (last 4 bytes of transaction)
  result.push(txBuffer.subarray(txBuffer.length - 4));
  
  // Concatenate all parts and return as hex
  return Buffer.concat(result).toString("hex");
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
