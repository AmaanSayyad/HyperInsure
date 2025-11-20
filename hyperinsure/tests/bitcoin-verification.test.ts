import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { removeWitnessData, doubleSha256, computeTxid } from "../utils/bitcoin-verification";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const oracle1 = accounts.get("wallet_1")!;

// Real SegWit transaction hex from block 924282 (with witness data)
const REAL_TX_HEX_WITNESS = "020000000001089a4b36d3bcf1b391934dc6ec9c36bec9d617049bbc80ad8a541c7de21d3793ce0400000000ffffffffc7d5fac9debf81e3015800a07f36e06cb65ed23a931a164478c3d782ad63a8ad0400000000ffffffffcd93e91f2321a94195c754c37d8be6605e52c48736d1883784b23a1d9268a8530000000000ffffffffd16660381b49d74c1416c303e77cbdf147aa5d98ab6153a21fb87c1ab6a2d4c70100000000ffffffffa56cad07c9be05d0810439b8300a0d6bcdb1a99837ba9d4c4c496eb2202cec950000000000ffffffffa9bb3c6abcb3863624d41fcab9dcce2b8a50c9a7f922d6bc75077d004db60fe60000000000ffffffffa7c45d80916f525ef88a6e3a2a7dbd9265626f5ed5bc401809e57f9819f488b40000000000ffffffffe10dce6436855d5f2b0895b10d9aa5b6d91992ccaa6830a8408df427f2eae13a0000000000ffffffff06b004000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e412202000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e4108700500000000002251207abc073c0c827c88408280ff7d5d111b73db7c7c6599436f565fc1f57410ddea5802000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e415802000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e411402000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e410140059de3f6afffc5c851a0dffba32ab2b2daf0737330efb94a5ef1f2d81347c562d9874324bf6a200db69ff9b6ed488014772a834022d1217d178f2cac01bb7c6701404aa31e1b025874d366093504620a68d4113f6df777717d83313c43118dfa08b6f8949e9acaff8c40e1feb44da01a8a5a7cf547b32f9b15305910906b11482fd50141ea01bcc41a618fdc4479816c04b4291b107d4007f92b385c6545f63b69f1cacabed548d39a561b9c660b4923eb5ed3409b2951f88bc5fadba15b33cd7f0c93398301403e2b23950f1e767a9ead2ee10451b8abd117c92be2a6a9578b40430fb6f4a87be638731f790a167e37f538556494d592f846e708e59c8a1b116afc75ffb17272014010e78b4976a8cfa74de00d71250e0d68261cf2da0bf8d6501f2c61efe0126e2c97ab5249548883223e10bc9eb9b7e7a1672187adebf414d57215be2aab21e529014083f98c7b1d8fd02af353c77c9d94828ef692ed9b0cb978e859f93c607493b808ade6e31b1908d1742e830ed367c45193caa57a0c98a25bf4c47b4e1636bb823a014073c5dd41e4ea2aece54e6a916a948ca56df32a65ee909b502c4e723c3ad458b4730fb943e6e7e2979f2bc0e64976c65bf4d53e52f8ebf20fd704acb693e58d45014068268454eaaf8c1b7cc0598cfdd39ae1a40fc4a6968d93c414495ba79ef15bd72d51b69ec21527935446bcef8d63066f6591d5f3c0b2fa13c078432686240c0400000000";

// Expected non-witness transaction hex (witness data stripped)
const REAL_TX_HEX_NON_WITNESS = "02000000089a4b36d3bcf1b391934dc6ec9c36bec9d617049bbc80ad8a541c7de21d3793ce0400000000ffffffffc7d5fac9debf81e3015800a07f36e06cb65ed23a931a164478c3d782ad63a8ad0400000000ffffffffcd93e91f2321a94195c754c37d8be6605e52c48736d1883784b23a1d9268a8530000000000ffffffffd16660381b49d74c1416c303e77cbdf147aa5d98ab6153a21fb87c1ab6a2d4c70100000000ffffffffa56cad07c9be05d0810439b8300a0d6bcdb1a99837ba9d4c4c496eb2202cec950000000000ffffffffa9bb3c6abcb3863624d41fcab9dcce2b8a50c9a7f922d6bc75077d004db60fe60000000000ffffffffa7c45d80916f525ef88a6e3a2a7dbd9265626f5ed5bc401809e57f9819f488b40000000000ffffffffe10dce6436855d5f2b0895b10d9aa5b6d91992ccaa6830a8408df427f2eae13a0000000000ffffffff06b004000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e412202000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e4108700500000000002251207abc073c0c827c88408280ff7d5d111b73db7c7c6599436f565fc1f57410ddea5802000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e415802000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e411402000000000000225120b37839937d94874efb9651208aa062b5704d824e4a501a0c0c82ce7a4aa00e4100000000";

describe("Bitcoin Transaction Verification Tests", () => {
  
  it("should register an oracle", () => {
    const publicKey = new Uint8Array(33).fill(1);
    
    const { result } = simnet.callPublicFn(
      "oracle",
      "register-oracle",
      [
        Cl.principal(oracle1),
        Cl.stringAscii("Bitcoin Oracle"),
        Cl.buffer(publicKey),
      ],
      deployer
    );
    
    expect(result).toBeOk(Cl.principal(oracle1));
  });

  it("should submit unverified attestation", () => {
    // Register oracle first
    const publicKey = new Uint8Array(33).fill(1);
    simnet.callPublicFn(
      "oracle",
      "register-oracle",
      [
        Cl.principal(oracle1),
        Cl.stringAscii("Bitcoin Oracle"),
        Cl.buffer(publicKey),
      ],
      deployer
    );

    // Submit attestation without proof
    const txHash = new Uint8Array(32).fill(1);
    const signature = new Uint8Array(65).fill(1);
    
    const { result } = simnet.callPublicFn(
      "oracle",
      "submit-attestation",
      [
        Cl.buffer(txHash),
        Cl.uint(883230), // Bitcoin block height
        Cl.uint(883235), // Inclusion height
        Cl.buffer(signature),
      ],
      oracle1
    );
    
    expect(result).toBeOk(Cl.uint(5)); // 5 blocks delay
    
    // Check attestation
    const { result: attestation } = simnet.callReadOnlyFn(
      "oracle",
      "get-attestation",
      [Cl.buffer(txHash)],
      deployer
    );
    
    const attData = attestation.value.value;
    expect(attData.verified).toBeBool(false);
    expect(attData["delay-blocks"]).toBeUint(5);
  });

  it("should calculate delay correctly", () => {
    const { result } = simnet.callReadOnlyFn(
      "oracle",
      "calculate-delay",
      [Cl.uint(883230), Cl.uint(883235)],
      deployer
    );
    
    expect(result).toBeUint(5);
  });

  it("should simulate Bitcoin transaction verification workflow", () => {
    // Simulated Bitcoin transaction verification (no network required)
    // This demonstrates the complete verification workflow using simnet
    
    // Register oracle
    const publicKey = new Uint8Array(33).fill(1);
    simnet.callPublicFn(
      "oracle",
      "register-oracle",
      [
        Cl.principal(oracle1),
        Cl.stringAscii("Bitcoin Oracle"),
        Cl.buffer(publicKey),
      ],
      deployer
    );

    // Simulated Bitcoin transaction data
    // In production, this would come from mempool.space API
    const txHash = Buffer.from("c1de234c01ecc47906117d012865ce3dabbbb081dc0309a74dbbae45e427aadc", "hex");
    const broadcastHeight = 883230;
    const inclusionHeight = 883270; // 40 blocks delay
    const signature = new Uint8Array(65).fill(1);
    
    // Submit attestation with simulated data
    const { result } = simnet.callPublicFn(
      "oracle",
      "submit-attestation",
      [
        Cl.buffer(txHash),
        Cl.uint(broadcastHeight),
        Cl.uint(inclusionHeight),
        Cl.buffer(signature),
      ],
      oracle1
    );
    
    expect(result).toBeOk(Cl.uint(40)); // 40 blocks delay
    
    // Verify attestation was stored correctly
    const { result: attestation } = simnet.callReadOnlyFn(
      "oracle",
      "get-attestation",
      [Cl.buffer(txHash)],
      deployer
    );
    
    const attData = attestation.value.value;
    expect(attData["delay-blocks"]).toBeUint(40);
    expect(attData["broadcast-height"]).toBeUint(broadcastHeight);
    expect(attData["inclusion-height"]).toBeUint(inclusionHeight);
    expect(attData["oracle-id"]).toBePrincipal(oracle1);
    
    console.log("\n✅ Bitcoin transaction verification workflow simulated successfully");
    console.log(`   Transaction: ${txHash.toString("hex").substring(0, 16)}...`);
    console.log(`   Delay: 40 blocks`);
    console.log(`   Oracle: ${oracle1}`);
  });
});

describe("removeWitnessData", () => {
  it("should strip witness data from segwit transaction", () => {
    // Test with real Bitcoin transaction data
    const result = removeWitnessData(REAL_TX_HEX_WITNESS);
    expect(result).toBe(REAL_TX_HEX_NON_WITNESS);
  });

  it("should return original for non-segwit transaction", () => {
    // Non-segwit transaction (no marker/flag after version)
    const nonSegwitTx = REAL_TX_HEX_NON_WITNESS;
    const result = removeWitnessData(nonSegwitTx);
    expect(result).toBe(nonSegwitTx);
  });

  it("should handle 0x prefix", () => {
    const result = removeWitnessData("0x" + REAL_TX_HEX_WITNESS);
    expect(result).toBe(REAL_TX_HEX_NON_WITNESS);
  });

  it("should return original for short transactions", () => {
    const shortTx = "01000000";
    const result = removeWitnessData(shortTx);
    expect(result).toBe(shortTx);
  });
});

/**
 * Double-SHA256 Hash Consistency Tests
 * 
 * These tests verify that the double-SHA256 hashing produces correct Bitcoin transaction IDs.
 * Requirements: 3.4
 */
describe("Double-SHA256 Hash Consistency", () => {
  // Real transaction data from block 924282
  const EXPECTED_TXID = "819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461";
  
  /**
   * Test: Hash the non-witness transaction and verify reversed hash equals txid
   * 
   * This test validates Requirement 3.4:
   * "WHEN the transaction is hashed THEN the System SHALL produce a hash that 
   * matches the expected txid when double-SHA256 is applied"
   * 
   * The Bitcoin txid is computed as:
   * 1. Apply SHA256 to the non-witness transaction bytes
   * 2. Apply SHA256 again to the result (double-SHA256)
   * 3. Reverse the byte order of the resulting hash
   * 
   * Requirements: 3.4
   */
  it("should produce correct txid from non-witness transaction via double-SHA256", () => {
    // Hash the non-witness transaction
    const hash = doubleSha256(REAL_TX_HEX_NON_WITNESS);
    
    // Verify hash is 32 bytes
    expect(hash.length).toBe(32);
    
    // Reverse the hash to get the txid (Bitcoin displays txids in reversed byte order)
    const reversedHash = Buffer.from(hash).reverse().toString("hex");
    
    console.log("\n🔐 Double-SHA256 Hash Consistency Test:");
    console.log(`   Non-witness tx length: ${REAL_TX_HEX_NON_WITNESS.length / 2} bytes`);
    console.log(`   Double-SHA256 hash: ${hash.toString("hex")}`);
    console.log(`   Reversed hash (txid): ${reversedHash}`);
    console.log(`   Expected txid: ${EXPECTED_TXID}`);
    
    // Verify reversed hash equals expected txid
    expect(reversedHash).toBe(EXPECTED_TXID);
    
    console.log("   ✅ Hash consistency verified - reversed double-SHA256 equals txid!");
  });

  it("should compute txid correctly using computeTxid utility", () => {
    // Use the computeTxid utility function
    const computedTxid = computeTxid(REAL_TX_HEX_NON_WITNESS);
    
    console.log("\n🔐 computeTxid Utility Test:");
    console.log(`   Computed txid: ${computedTxid}`);
    console.log(`   Expected txid: ${EXPECTED_TXID}`);
    
    // Verify computed txid matches expected
    expect(computedTxid).toBe(EXPECTED_TXID);
    
    console.log("   ✅ computeTxid utility produces correct txid!");
  });

  it("should verify doubleSha256 produces consistent results", () => {
    // Test that doubleSha256 is deterministic
    const hash1 = doubleSha256(REAL_TX_HEX_NON_WITNESS);
    const hash2 = doubleSha256(REAL_TX_HEX_NON_WITNESS);
    
    expect(hash1.toString("hex")).toBe(hash2.toString("hex"));
    
    console.log("\n🔐 Double-SHA256 Determinism Test:");
    console.log("   ✅ doubleSha256 produces consistent results!");
  });

  it("should handle hex string with 0x prefix", () => {
    const hashWithPrefix = doubleSha256("0x" + REAL_TX_HEX_NON_WITNESS);
    const hashWithoutPrefix = doubleSha256(REAL_TX_HEX_NON_WITNESS);
    
    expect(hashWithPrefix.toString("hex")).toBe(hashWithoutPrefix.toString("hex"));
    
    console.log("\n🔐 0x Prefix Handling Test:");
    console.log("   ✅ doubleSha256 handles 0x prefix correctly!");
  });

  it("should handle Buffer input", () => {
    const txBuffer = Buffer.from(REAL_TX_HEX_NON_WITNESS, "hex");
    const hashFromBuffer = doubleSha256(txBuffer);
    const hashFromHex = doubleSha256(REAL_TX_HEX_NON_WITNESS);
    
    expect(hashFromBuffer.toString("hex")).toBe(hashFromHex.toString("hex"));
    
    console.log("\n🔐 Buffer Input Test:");
    console.log("   ✅ doubleSha256 handles Buffer input correctly!");
  });
});
