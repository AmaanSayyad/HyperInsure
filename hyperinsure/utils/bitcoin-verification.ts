/**
 * Bitcoin Verification Utilities for HyperInsure V2
 * 
 * This module provides utilities to fetch real Bitcoin transaction data
 * and prepare it for trustless verification using clarity-bitcoin-lib-v5
 * 
 * Enhanced for Insurance Claim Verification System
 * Requirements: 4.1, 4.2, 4.3, 6.2
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
// Enhanced Data Formatting Utilities for Insurance Claims
// Requirements: 4.1, 6.2
// ============================================================================

/**
 * Convert a hex string to a Buffer with enhanced validation
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Buffer containing the bytes
 * @throws Error if hex string is invalid
 */
export function hexToBuffer(hex: string): Buffer {
  if (hex === null || hex === undefined || hex.length === 0) {
    return Buffer.alloc(0);
  }
  
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  
  // Validate hex string
  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
    throw new Error(`Invalid hex string: ${hex}`);
  }
  
  // Ensure even length
  if (cleanHex.length % 2 !== 0) {
    throw new Error(`Hex string must have even length: ${hex}`);
  }
  
  return Buffer.from(cleanHex, "hex");
}

/**
 * Convert a Buffer to a hex string with validation
 * @param buffer - Buffer to convert
 * @returns Hex string (lowercase, no 0x prefix)
 * @throws Error if buffer is null or undefined
 */
export function bufferToHex(buffer: Buffer): string {
  if (!buffer) {
    throw new Error("Buffer cannot be null or undefined");
  }
  
  if (buffer.length === 0) {
    return "";
  }
  
  return buffer.toString("hex");
}

/**
 * Reverse the byte order of a hex string with validation
 * Used for converting between Bitcoin's little-endian and big-endian formats
 * @param hexString - Hex string to reverse (must be even length)
 * @returns Buffer with reversed byte order
 * @throws Error if hex string is invalid
 */
export function reverseBytes(hexString: string): Buffer {
  if (hexString === null || hexString === undefined || hexString.length === 0) {
    return Buffer.alloc(0);
  }
  
  // Remove 0x prefix if present
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  
  // Validate hex string
  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
    throw new Error(`Invalid hex string for byte reversal: ${hexString}`);
  }
  
  // Ensure even length
  if (cleanHex.length % 2 !== 0) {
    throw new Error(`Hex string must have even length for byte reversal: ${hexString}`);
  }
  
  // Convert to buffer and reverse
  const buffer = Buffer.from(cleanHex, "hex");
  return Buffer.from(buffer.reverse());
}

/**
 * Validate Bitcoin transaction hash format
 * @param hash - Hash to validate (32 bytes as hex string)
 * @returns true if valid Bitcoin transaction hash
 */
export function isValidBitcoinHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  
  const cleanHex = hash.startsWith("0x") ? hash.slice(2) : hash;
  
  // Bitcoin hashes are exactly 32 bytes (64 hex characters)
  if (cleanHex.length !== 64) {
    return false;
  }
  
  // Must be valid hex
  return /^[0-9a-fA-F]{64}$/.test(cleanHex);
}

/**
 * Validate Bitcoin block header format
 * @param header - Block header to validate (80 bytes as hex string)
 * @returns true if valid Bitcoin block header
 */
export function isValidBlockHeader(header: string): boolean {
  if (!header || typeof header !== 'string') {
    return false;
  }
  
  const cleanHex = header.startsWith("0x") ? header.slice(2) : header;
  
  // Bitcoin block headers are exactly 80 bytes (160 hex characters)
  if (cleanHex.length !== 160) {
    return false;
  }
  
  // Must be valid hex
  return /^[0-9a-fA-F]{160}$/.test(cleanHex);
}

/**
 * Validate merkle proof structure
 * @param proof - Merkle proof to validate
 * @returns true if valid merkle proof structure
 */
export function isValidMerkleProof(proof: RawMerkleProof): boolean {
  if (!proof || typeof proof !== 'object') {
    return false;
  }
  
  // Check required fields
  if (typeof proof.block_height !== 'number' || proof.block_height <= 0) {
    return false;
  }
  
  if (typeof proof.pos !== 'number' || proof.pos < 0) {
    return false;
  }
  
  if (!Array.isArray(proof.merkle)) {
    return false;
  }
  
  // Validate each merkle hash
  for (const hash of proof.merkle) {
    if (!isValidBitcoinHash(hash)) {
      return false;
    }
  }
  
  // Merkle proof should have reasonable depth (1-20 hashes)
  if (proof.merkle.length < 1 || proof.merkle.length > 20) {
    return false;
  }
  
  return true;
}

/**
 * Compute double-SHA256 hash of data (SHA256(SHA256(data)))
 * This is the standard Bitcoin transaction hashing algorithm
 * @param data - Buffer or hex string to hash
 * @returns Buffer containing the 32-byte double-SHA256 hash
 * @throws Error if data is invalid
 */
export function doubleSha256(data: Buffer | string): Buffer {
  let buffer: Buffer;
  
  if (typeof data === "string") {
    const cleanHex = data.startsWith("0x") ? data.slice(2) : data;
    
    // Validate hex string
    if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
      throw new Error(`Invalid hex string for hashing: ${data}`);
    }
    
    buffer = Buffer.from(cleanHex, "hex");
  } else if (Buffer.isBuffer(data)) {
    buffer = data;
  } else {
    throw new Error("Data must be a Buffer or hex string");
  }
  
  if (buffer.length === 0) {
    throw new Error("Cannot hash empty data");
  }
  
  const firstHash = createHash("sha256").update(buffer).digest();
  const secondHash = createHash("sha256").update(firstHash).digest();
  
  return secondHash;
}

/**
 * Compute the Bitcoin transaction ID (txid) from a non-witness transaction hex
 * The txid is the reversed double-SHA256 hash of the transaction
 * @param txHex - Non-witness transaction hex string
 * @returns The transaction ID as a hex string (reversed byte order)
 * @throws Error if transaction hex is invalid
 */
export function computeTxid(txHex: string): string {
  if (!txHex || typeof txHex !== 'string') {
    throw new Error("Transaction hex cannot be empty");
  }
  
  const cleanHex = txHex.startsWith("0x") ? txHex.slice(2) : txHex;
  
  // Basic validation - transaction should be at least 60 bytes (version + inputs + outputs + locktime)
  if (cleanHex.length < 120) { // 60 bytes * 2 hex chars
    throw new Error("Transaction hex too short to be valid");
  }
  
  const hash = doubleSha256(cleanHex);
  
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
 * - Validates input data before formatting
 * @param proof - Raw merkle proof from mempool.space API
 * @returns Formatted merkle proof for Clarity
 * @throws Error if proof is invalid
 */
export function formatMerkleProofForClarity(proof: RawMerkleProof): MerkleProofForClarity {
  // Validate input proof
  if (!isValidMerkleProof(proof)) {
    throw new Error("Invalid merkle proof structure");
  }
  
  // Validate tree depth limits for Clarity (max 14 hashes in clarity-bitcoin-lib-v5)
  if (proof.merkle.length > 14) {
    throw new Error(`Merkle proof too deep: ${proof.merkle.length} hashes (max 14)`);
  }
  
  try {
    return {
      "tx-index": proof.pos,
      hashes: proof.merkle.map((hash) => reverseBytes(hash)),
      "tree-depth": proof.merkle.length,
    };
  } catch (error) {
    throw new Error(`Failed to format merkle proof: ${error.message}`);
  }
}

// ============================================================================
// Enhanced Clarity Contract Integration
// Requirements: 4.1, 4.2, 4.3
// ============================================================================

/**
 * Convert formatted merkle proof to Clarity tuple CV
 * @param proof - Formatted merkle proof
 * @returns Clarity tuple CV for contract calls
 */
export function merkleProofToTupleCV(proof: MerkleProofForClarity): ClarityValue {
  return tupleCV({
    "tx-index": uintCV(proof["tx-index"]),
    hashes: listCV(proof.hashes.map(h => bufferCV(h))),
    "tree-depth": uintCV(proof["tree-depth"])
  });
}

/**
 * Prepare complete Bitcoin proof data for Clarity contract submission
 * This function validates and formats all required data for claim submission
 * @param txData - Complete Bitcoin transaction data
 * @returns Formatted proof data ready for Clarity contract calls
 * @throws Error if any data is invalid
 */
export function prepareBitcoinProofForClarity(txData: BitcoinTxData): {
  txHash: Buffer;
  tx: Buffer;
  header: Buffer;
  proof: ClarityValue;
  blockHeight: number;
} {
  // Validate transaction ID
  if (!isValidBitcoinHash(txData.txid)) {
    throw new Error(`Invalid transaction ID: ${txData.txid}`);
  }
  
  // Validate transaction hex
  if (!txData.txHex || typeof txData.txHex !== 'string') {
    throw new Error("Transaction hex is required");
  }
  
  // Validate block header
  if (!isValidBlockHeader(txData.blockHeader)) {
    throw new Error(`Invalid block header: ${txData.blockHeader}`);
  }
  
  // Validate merkle proof structure
  const rawProof: RawMerkleProof = {
    block_height: txData.blockHeight,
    pos: txData.merkleProof.pos,
    merkle: txData.merkleProof.merkle
  };
  
  if (!isValidMerkleProof(rawProof)) {
    throw new Error("Invalid merkle proof data");
  }
  
  // Format merkle proof for Clarity
  const formattedProof = formatMerkleProofForClarity(rawProof);
  
  // Verify computed txid matches expected
  const computedTxid = computeTxid(txData.txHex);
  if (computedTxid !== txData.txid) {
    throw new Error(`Transaction ID mismatch: computed ${computedTxid}, expected ${txData.txid}`);
  }
  
  return {
    txHash: hexToBuffer(txData.txid),
    tx: hexToBuffer(txData.txHex),
    header: hexToBuffer(txData.blockHeader),
    proof: merkleProofToTupleCV(formattedProof),
    blockHeight: txData.blockHeight,
  };
}

// ============================================================================
// Enhanced Bitcoin Data Fetching Functions
// Requirements: 6.2, 6.3
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
 * Fetch Bitcoin transaction hex from mempool.space with enhanced error handling
 * @param txid - Bitcoin transaction ID
 * @returns Transaction hex string
 * @throws Error if fetch fails or txid is invalid
 */
export async function getTxHex(txid: string): Promise<string> {
  if (!isValidBitcoinHash(txid)) {
    throw new Error(`Invalid transaction ID format: ${txid}`);
  }
  
  try {
    const response = await fetch(`https://mempool.space/api/tx/${txid}/hex`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Transaction not found: ${txid}`);
      }
      throw new Error(`Failed to fetch transaction: ${response.status} ${response.statusText}`);
    }
    
    const txHex = await response.text();
    
    // Validate returned transaction hex
    if (!txHex || txHex.length < 120) { // Minimum valid transaction size
      throw new Error(`Invalid transaction hex received for ${txid}`);
    }
    
    return txHex;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error fetching transaction ${txid}: ${error}`);
  }
}

/**
 * Fetch Bitcoin transaction merkle proof with enhanced validation
 * @param txid - Bitcoin transaction ID
 * @returns Raw merkle proof data
 * @throws Error if fetch fails or proof is invalid
 */
export async function getTxMerkleProof(txid: string): Promise<RawMerkleProof> {
  if (!isValidBitcoinHash(txid)) {
    throw new Error(`Invalid transaction ID format: ${txid}`);
  }
  
  try {
    const response = await fetch(`https://mempool.space/api/tx/${txid}/merkle-proof`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Transaction not found or not confirmed: ${txid}`);
      }
      throw new Error(`Failed to fetch merkle proof: ${response.status} ${response.statusText}`);
    }
    
    const proof = await response.json();
    
    // Validate merkle proof structure
    if (!isValidMerkleProof(proof)) {
      throw new Error(`Invalid merkle proof received for ${txid}`);
    }
    
    return proof;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error fetching merkle proof for ${txid}: ${error}`);
  }
}

/**
 * Fetch Bitcoin block header with validation
 * @param blockHash - Bitcoin block hash
 * @returns Block header hex string (80 bytes)
 * @throws Error if fetch fails or header is invalid
 */
export async function getBlockHeader(blockHash: string): Promise<string> {
  if (!isValidBitcoinHash(blockHash)) {
    throw new Error(`Invalid block hash format: ${blockHash}`);
  }
  
  try {
    const response = await fetch(`https://mempool.space/api/block/${blockHash}/header`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Block not found: ${blockHash}`);
      }
      throw new Error(`Failed to fetch block header: ${response.status} ${response.statusText}`);
    }
    
    const header = await response.text();
    
    // Validate block header
    if (!isValidBlockHeader(header)) {
      throw new Error(`Invalid block header received for ${blockHash}`);
    }
    
    return header;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error fetching block header for ${blockHash}: ${error}`);
  }
}

/**
 * Fetch block hash by height with validation
 * @param height - Bitcoin block height
 * @returns Block hash string
 * @throws Error if fetch fails or height is invalid
 */
export async function getBlockHashByHeight(height: number): Promise<string> {
  if (!Number.isInteger(height) || height < 0) {
    throw new Error(`Invalid block height: ${height}`);
  }
  
  // Bitcoin genesis block is at height 0, current height should be reasonable
  if (height > 1000000) { // Sanity check for future blocks
    throw new Error(`Block height too high: ${height}`);
  }
  
  try {
    const response = await fetch(`https://mempool.space/api/block-height/${height}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Block height not found: ${height}`);
      }
      throw new Error(`Failed to fetch block hash: ${response.status} ${response.statusText}`);
    }
    
    const blockHash = await response.text();
    
    // Validate returned block hash
    if (!isValidBitcoinHash(blockHash)) {
      throw new Error(`Invalid block hash received for height ${height}: ${blockHash}`);
    }
    
    return blockHash;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error fetching block hash for height ${height}: ${error}`);
  }
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
 * Remove witness data from a SegWit transaction hex with enhanced validation
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
 * @throws Error if transaction hex is invalid
 */
export function removeWitnessData(txHex: string): string {
  if (!txHex || typeof txHex !== 'string') {
    throw new Error("Transaction hex cannot be empty");
  }
  
  // Remove 0x prefix if present
  const cleanHex = txHex.startsWith("0x") ? txHex.slice(2) : txHex;
  
  // Validate hex string
  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
    throw new Error(`Invalid hex string: ${txHex}`);
  }
  
  // Convert to buffer for easier manipulation
  const txBuffer = Buffer.from(cleanHex, "hex");
  
  // Check minimum length (version + marker + flag + at least some data + locktime)
  if (txBuffer.length < 10) {
    return cleanHex; // Too short to be SegWit, return as-is
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
  
  try {
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
  } catch (error) {
    throw new Error(`Failed to remove witness data: ${error.message}`);
  }
}

/**
 * Fetch complete Bitcoin transaction data for verification with comprehensive validation
 * @param txid - Bitcoin transaction ID
 * @returns Complete Bitcoin transaction data ready for verification
 * @throws Error if any data fetch or validation fails
 */
export async function getBitcoinTxDataForVerification(txid: string): Promise<BitcoinTxData> {
  if (!isValidBitcoinHash(txid)) {
    throw new Error(`Invalid transaction ID: ${txid}`);
  }
  
  try {
    // Fetch transaction hex
    const fullTxHex = await getTxHex(txid);
    const txHex = removeWitnessData(fullTxHex);

    // Fetch merkle proof
    const merkleProof = await getTxMerkleProof(txid);
    const { block_height, merkle, pos } = merkleProof;

    // Fetch block header
    const blockHash = await getBlockHashByHeight(block_height);
    const blockHeader = await getBlockHeader(blockHash);

    // Validate computed txid matches expected
    const computedTxid = computeTxid(txHex);
    if (computedTxid !== txid) {
      throw new Error(`Transaction ID verification failed: computed ${computedTxid}, expected ${txid}`);
    }

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
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch Bitcoin transaction data for ${txid}: ${error}`);
  }
}

/**
 * Verify Bitcoin transaction using clarity-bitcoin-lib-v5 on mainnet with enhanced error handling
 * 
 * This function calls the deployed clarity-bitcoin-lib-v5 contract
 * to verify that a Bitcoin transaction was mined in a specific block
 * 
 * @param txid - Bitcoin transaction ID
 * @param senderAddress - Stacks address for the contract call
 * @returns Verification result with success status and detailed response
 * @throws Error if verification setup fails
 */
export async function verifyBitcoinTransaction(
  txid: string,
  senderAddress: string
): Promise<{ success: boolean; result: string; txHash?: string }> {
  if (!isValidBitcoinHash(txid)) {
    throw new Error(`Invalid transaction ID: ${txid}`);
  }
  
  if (!senderAddress || typeof senderAddress !== 'string') {
    throw new Error("Valid sender address is required");
  }
  
  const mainnet = new StacksMainnet();

  // Clarity-bitcoin-lib-v5 contract on mainnet
  const contractAddress = "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
  const contractName = "clarity-bitcoin-lib-v5";
  const functionName = "was-tx-mined-compact";

  try {
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
    const isSuccess = resultString.startsWith("(ok");
    
    let extractedTxHash: string | undefined;
    if (isSuccess) {
      // Try to extract the tx hash from the ok response
      try {
        const okValue = (result as any).value;
        if (okValue && okValue.value) {
          const rawBuffer = Buffer.from(okValue.value);
          
          if (rawBuffer.length === 64) {
            // The value is a hex string encoded as bytes, decode it
            const hexString = rawBuffer.toString('utf8');
            const hashBuffer = Buffer.from(hexString, 'hex');
            extractedTxHash = Buffer.from(hashBuffer).reverse().toString("hex");
          } else if (rawBuffer.length === 32) {
            // The value is raw bytes
            extractedTxHash = Buffer.from(rawBuffer).reverse().toString("hex");
          }
        }
      } catch (error) {
        // Hash extraction failed, but verification still succeeded
        console.warn("Failed to extract tx hash from verification result:", error);
      }
    }

    return {
      success: isSuccess,
      result: resultString,
      txHash: extractedTxHash,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Bitcoin transaction verification failed: ${error}`);
  }
}

/**
 * Prepare Bitcoin proof data for Clarity contract call (legacy function for backward compatibility)
 * 
 * This function prepares the data structure needed for submit-claim-with-proof
 * @param txData - Complete Bitcoin transaction data
 * @returns Formatted proof data for contract calls
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

// ============================================================================
// Utility Functions for Testing and Development
// Requirements: 6.2, 6.5
// ============================================================================

/**
 * Generate a comprehensive Bitcoin data summary for testing and debugging
 * @param txid - Bitcoin transaction ID
 * @returns Detailed summary of Bitcoin transaction data
 */
export async function generateBitcoinDataSummary(txid: string): Promise<{
  txid: string;
  dataFetchSuccess: boolean;
  verificationReady: boolean;
  summary: {
    blockHeight: number;
    txSize: number;
    headerSize: number;
    merkleDepth: number;
    merklePosition: number;
    computedTxid: string;
    txidMatch: boolean;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  let txData: BitcoinTxData | null = null;
  let dataFetchSuccess = false;
  let verificationReady = false;
  
  try {
    // Attempt to fetch all Bitcoin data
    txData = await getBitcoinTxDataForVerification(txid);
    dataFetchSuccess = true;
    
    // Validate data for verification readiness
    const computedTxid = computeTxid(txData.txHex);
    const txidMatch = computedTxid === txid;
    
    if (txidMatch && 
        isValidBlockHeader(txData.blockHeader) && 
        isValidMerkleProof({
          block_height: txData.blockHeight,
          pos: txData.merkleProof.pos,
          merkle: txData.merkleProof.merkle
        })) {
      verificationReady = true;
    }
    
    return {
      txid,
      dataFetchSuccess,
      verificationReady,
      summary: {
        blockHeight: txData.blockHeight,
        txSize: txData.txHex.length / 2,
        headerSize: txData.blockHeader.length / 2,
        merkleDepth: txData.merkleProof.treeDepth,
        merklePosition: txData.merkleProof.pos,
        computedTxid,
        txidMatch,
      },
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    
    return {
      txid,
      dataFetchSuccess,
      verificationReady,
      summary: {
        blockHeight: 0,
        txSize: 0,
        headerSize: 0,
        merkleDepth: 0,
        merklePosition: 0,
        computedTxid: "",
        txidMatch: false,
      },
      errors,
    };
  }
}

/**
 * Example usage and documentation:
 * 
 * ```typescript
 * // Enhanced Bitcoin data fetching and verification
 * const txid = "819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461";
 * const senderAddress = "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
 * 
 * // Fetch and validate Bitcoin transaction data
 * try {
 *   const txData = await getBitcoinTxDataForVerification(txid);
 *   console.log("✅ Bitcoin data fetched successfully");
 *   
 *   // Prepare data for Clarity contract
 *   const proofData = prepareBitcoinProofForClarity(txData);
 *   console.log("✅ Proof data formatted for Clarity");
 *   
 *   // Verify transaction on mainnet
 *   const { success, result, txHash } = await verifyBitcoinTransaction(txid, senderAddress);
 *   
 *   if (success) {
 *     console.log("✅ Transaction verified on Bitcoin mainnet");
 *     console.log(`   Returned tx hash: ${txHash}`);
 *   } else {
 *     console.log("❌ Transaction verification failed");
 *     console.log(`   Error: ${result}`);
 *   }
 *   
 *   // Generate comprehensive summary for debugging
 *   const summary = await generateBitcoinDataSummary(txid);
 *   console.log("📊 Bitcoin Data Summary:", summary);
 *   
 * } catch (error) {
 *   console.error("❌ Bitcoin data processing failed:", error.message);
 * }
 * 
 * // Submit claim with enhanced proof data
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
