/**
 * Utility Function Tests for Bitcoin Verification
 * 
 * These tests verify the Bitcoin data fetching and formatting utilities
 * work correctly with real Bitcoin mainnet data.
 * 
 * Requirements: 5.1, 5.2, 5.3, 2.4
 */

import { describe, it, expect } from "vitest";
import {
  getTxHex,
  getTxMerkleProof,
  getBlockHeader,
  getBlockHashByHeight,
  hexToBuffer,
} from "../utils/bitcoin-verification";

// Known test data from block 924282
const KNOWN_TXID = "819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461";
const KNOWN_BLOCK_HEIGHT = 924282;
const KNOWN_BLOCK_HASH = "0000000000000000000145211d9076270f71040c6b2b6ef908c4bc8d9b598823";

// Hardcoded expected values for deterministic testing
const EXPECTED_MERKLE_POS = 878;
const EXPECTED_MERKLE_LENGTH = 12;

// Real 80-byte block header for block 924282 (hardcoded for reference)
const REAL_BLOCK_HEADER = "0000002047e0e6c63ec3ba0dcc6752c7088a4690471d60722191000000000000000000003709453fe8c0f5e81b9bb2ca88ae164198e8845c8df45b2f0557724e11f84d7bbcb01d6936d90117dfeeea25";

/**
 * Task 7.1: Unit tests for getTxHex function
 * Requirements: 5.1
 */
describe("getTxHex", () => {
  it("should return valid transaction hex for known txid", async () => {
    const txHex = await getTxHex(KNOWN_TXID);
    
    // Verify returned hex is a non-empty string
    expect(typeof txHex).toBe("string");
    expect(txHex.length).toBeGreaterThan(0);
    
    // Verify hex is valid (only hex characters)
    expect(/^[0-9a-fA-F]+$/.test(txHex)).toBe(true);
    
    // Verify minimum transaction length (version + inputs + outputs + locktime)
    // A minimal transaction is at least 10 bytes (20 hex chars)
    expect(txHex.length).toBeGreaterThanOrEqual(20);
    
    console.log("\n✅ getTxHex Test:");
    console.log(`   TxID: ${KNOWN_TXID.substring(0, 16)}...`);
    console.log(`   Returned hex length: ${txHex.length} chars (${txHex.length / 2} bytes)`);
  }, 30000); // 30 second timeout for network call

  it("should throw error for invalid txid", async () => {
    const invalidTxid = "0000000000000000000000000000000000000000000000000000000000000000";
    
    await expect(getTxHex(invalidTxid)).rejects.toThrow();
    
    console.log("\n✅ getTxHex Error Handling Test:");
    console.log("   Invalid txid correctly throws error");
  }, 30000);
});

/**
 * Task 7.2: Unit tests for getTxMerkleProof function
 * Requirements: 5.2
 */
describe("getTxMerkleProof", () => {
  it("should return correct block_height, pos, and merkle array for known txid", async () => {
    const proof = await getTxMerkleProof(KNOWN_TXID);
    
    // Verify block_height matches expected
    expect(proof.block_height).toBe(KNOWN_BLOCK_HEIGHT);
    
    // Verify pos (position in block) matches expected
    expect(proof.pos).toBe(EXPECTED_MERKLE_POS);
    
    // Verify merkle array exists and has correct length
    expect(Array.isArray(proof.merkle)).toBe(true);
    expect(proof.merkle.length).toBe(EXPECTED_MERKLE_LENGTH);
    
    // Verify each merkle hash is a valid 32-byte hex string (64 chars)
    for (const hash of proof.merkle) {
      expect(typeof hash).toBe("string");
      expect(hash.length).toBe(64);
      expect(/^[0-9a-fA-F]+$/.test(hash)).toBe(true);
    }
    
    console.log("\n✅ getTxMerkleProof Test:");
    console.log(`   TxID: ${KNOWN_TXID.substring(0, 16)}...`);
    console.log(`   Block Height: ${proof.block_height}`);
    console.log(`   Position: ${proof.pos}`);
    console.log(`   Merkle Hashes: ${proof.merkle.length}`);
  }, 30000);

  it("should throw error for invalid txid", async () => {
    const invalidTxid = "0000000000000000000000000000000000000000000000000000000000000000";
    
    await expect(getTxMerkleProof(invalidTxid)).rejects.toThrow();
    
    console.log("\n✅ getTxMerkleProof Error Handling Test:");
    console.log("   Invalid txid correctly throws error");
  }, 30000);
});

/**
 * Task 7.3: Unit tests for getBlockHeader function
 * Requirements: 5.3
 */
describe("getBlockHeader", () => {
  it("should return 80-byte header for known block hash", async () => {
    const header = await getBlockHeader(KNOWN_BLOCK_HASH);
    
    // Verify header is a string
    expect(typeof header).toBe("string");
    
    // Verify header is exactly 80 bytes (160 hex characters)
    expect(header.length).toBe(160);
    
    // Verify hex is valid
    expect(/^[0-9a-fA-F]+$/.test(header)).toBe(true);
    
    // Verify header matches expected hardcoded value
    expect(header).toBe(REAL_BLOCK_HEADER);
    
    console.log("\n✅ getBlockHeader Test:");
    console.log(`   Block Hash: ${KNOWN_BLOCK_HASH.substring(0, 16)}...`);
    console.log(`   Header Length: ${header.length} chars (${header.length / 2} bytes)`);
    console.log(`   Matches Expected: true`);
  }, 30000);

  it("should throw error for invalid block hash", async () => {
    const invalidHash = "0000000000000000000000000000000000000000000000000000000000000000";
    
    await expect(getBlockHeader(invalidHash)).rejects.toThrow();
    
    console.log("\n✅ getBlockHeader Error Handling Test:");
    console.log("   Invalid block hash correctly throws error");
  }, 30000);
});

/**
 * Task 7.4: Unit tests for merkle root extraction
 * Requirements: 2.4
 * 
 * Block header structure:
 * - Bytes 0-3:    Version (4 bytes)
 * - Bytes 4-35:   Previous Block Hash (32 bytes)
 * - Bytes 36-67:  Merkle Root (32 bytes)
 * - Bytes 68-71:  Timestamp (4 bytes)
 * - Bytes 72-75:  Difficulty Target (4 bytes)
 * - Bytes 76-79:  Nonce (4 bytes)
 */
describe("Merkle Root Extraction", () => {
  it("should extract merkle root from bytes 36-68 of header", () => {
    const headerBuffer = hexToBuffer(REAL_BLOCK_HEADER);
    
    // Verify header is 80 bytes
    expect(headerBuffer.length).toBe(80);
    
    // Extract merkle root (bytes 36-68, which is 32 bytes)
    const merkleRoot = headerBuffer.subarray(36, 68);
    
    // Verify merkle root is 32 bytes
    expect(merkleRoot.length).toBe(32);
    
    // Convert to hex for display
    const merkleRootHex = merkleRoot.toString("hex");
    
    // Verify it's a valid 32-byte hash (64 hex chars)
    expect(merkleRootHex.length).toBe(64);
    expect(/^[0-9a-fA-F]+$/.test(merkleRootHex)).toBe(true);
    
    console.log("\n✅ Merkle Root Extraction Test:");
    console.log(`   Header Length: ${headerBuffer.length} bytes`);
    console.log(`   Merkle Root (bytes 36-68): ${merkleRootHex}`);
    console.log(`   Merkle Root Length: ${merkleRoot.length} bytes`);
  });

  it("should extract correct header components", () => {
    const headerBuffer = hexToBuffer(REAL_BLOCK_HEADER);
    
    // Extract all header components
    const version = headerBuffer.subarray(0, 4);
    const prevBlockHash = headerBuffer.subarray(4, 36);
    const merkleRoot = headerBuffer.subarray(36, 68);
    const timestamp = headerBuffer.subarray(68, 72);
    const difficultyTarget = headerBuffer.subarray(72, 76);
    const nonce = headerBuffer.subarray(76, 80);
    
    // Verify all components have correct lengths
    expect(version.length).toBe(4);
    expect(prevBlockHash.length).toBe(32);
    expect(merkleRoot.length).toBe(32);
    expect(timestamp.length).toBe(4);
    expect(difficultyTarget.length).toBe(4);
    expect(nonce.length).toBe(4);
    
    // Verify total equals 80 bytes
    const totalLength = version.length + prevBlockHash.length + merkleRoot.length + 
                        timestamp.length + difficultyTarget.length + nonce.length;
    expect(totalLength).toBe(80);
    
    console.log("\n✅ Header Component Extraction Test:");
    console.log(`   Version: ${version.toString("hex")} (${version.length} bytes)`);
    console.log(`   Prev Block Hash: ${prevBlockHash.toString("hex").substring(0, 16)}... (${prevBlockHash.length} bytes)`);
    console.log(`   Merkle Root: ${merkleRoot.toString("hex").substring(0, 16)}... (${merkleRoot.length} bytes)`);
    console.log(`   Timestamp: ${timestamp.toString("hex")} (${timestamp.length} bytes)`);
    console.log(`   Difficulty: ${difficultyTarget.toString("hex")} (${difficultyTarget.length} bytes)`);
    console.log(`   Nonce: ${nonce.toString("hex")} (${nonce.length} bytes)`);
    console.log(`   Total: ${totalLength} bytes`);
  });

  it("should verify merkle root is non-zero", () => {
    const headerBuffer = hexToBuffer(REAL_BLOCK_HEADER);
    const merkleRoot = headerBuffer.subarray(36, 68);
    
    // Verify merkle root is not all zeros (would indicate invalid block)
    const isAllZeros = merkleRoot.every(byte => byte === 0);
    expect(isAllZeros).toBe(false);
    
    console.log("\n✅ Merkle Root Non-Zero Test:");
    console.log("   Merkle root contains non-zero bytes: true");
  });
});

/**
 * Integration test: Fetch block hash by height and then get header
 */
describe("Block Hash and Header Integration", () => {
  it("should fetch block hash by height and retrieve matching header", async () => {
    // First get block hash by height
    const blockHash = await getBlockHashByHeight(KNOWN_BLOCK_HEIGHT);
    
    // Verify block hash matches expected
    expect(blockHash).toBe(KNOWN_BLOCK_HASH);
    
    // Then get header using the block hash
    const header = await getBlockHeader(blockHash);
    
    // Verify header is 80 bytes
    expect(header.length).toBe(160);
    
    // Verify header matches expected
    expect(header).toBe(REAL_BLOCK_HEADER);
    
    console.log("\n✅ Block Hash and Header Integration Test:");
    console.log(`   Block Height: ${KNOWN_BLOCK_HEIGHT}`);
    console.log(`   Block Hash: ${blockHash.substring(0, 16)}...`);
    console.log(`   Header Length: ${header.length / 2} bytes`);
  }, 30000);
});
