import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { getBitcoinTxData } from "../utils/bitcoin-data";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const oracle = accounts.get("wallet_1")!;
const user = accounts.get("wallet_2")!;

/**
 * Real Bitcoin Mainnet Transaction Test
 * 
 * TxID: 819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461
 * Fee Rate: 2.21 sat/vB
 * Broadcast Height: ~924,233
 * Confirmation Height: 924,282
 * Delay: 49 blocks (exceeds 35 block threshold)
 * 
 * This test verifies that a real delayed Bitcoin transaction
 * can be used to claim insurance payout.
 */
describe("Mainnet Bitcoin Transaction Claim", () => {
  const REAL_TXID = "819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461";
  const BROADCAST_HEIGHT = 924233;
  const CONFIRMATION_HEIGHT = 924282;
  const DELAY_BLOCKS = 49;
  const THRESHOLD = 35;

  it("should process claim for real delayed Bitcoin transaction", async () => {
    // Step 1: Fund the contract
    simnet.callPublicFn(
      "hyperinsure-core",
      "fund-contract",
      [Cl.uint(100000000)], // 100 STX
      deployer
    );

    // Step 2: Create policy with 35 block threshold
    const { result: policyResult } = simnet.callPublicFn(
      "hyperinsure-core",
      "create-policy",
      [
        Cl.stringAscii("btc-delay-mainnet"),
        Cl.stringAscii("Bitcoin Mainnet Delay Insurance"),
        Cl.stringUtf8("Real-world Bitcoin transaction delay protection"),
        Cl.uint(THRESHOLD), // 35 blocks threshold
        Cl.uint(500), // 5% premium
        Cl.uint(100), // 1% protocol fee
        Cl.uint(10000000), // 10 STX payout
      ],
      deployer
    );
    expect(policyResult).toBeOk(Cl.stringAscii("btc-delay-mainnet"));

    // Step 3: User purchases policy
    const { result: purchaseResult } = simnet.callPublicFn(
      "hyperinsure-core",
      "purchase-policy",
      [
        Cl.stringAscii("btc-delay-mainnet"),
        Cl.uint(20000000), // 20 STX
        Cl.stringAscii("mainnet-purchase-001"),
      ],
      user
    );
    expect(purchaseResult).toBeOk(Cl.stringAscii("mainnet-purchase-001"));

    // Step 4: Register oracle
    const publicKey = new Uint8Array(33).fill(1);
    const { result: oracleResult } = simnet.callPublicFn(
      "oracle",
      "register-oracle",
      [
        Cl.principal(oracle),
        Cl.stringAscii("Mainnet Oracle"),
        Cl.buffer(publicKey),
      ],
      deployer
    );
    expect(oracleResult).toBeOk(Cl.principal(oracle));

    // Step 5: Convert real txid to buffer
    const txHashBuffer = Buffer.from(REAL_TXID, "hex");

    // Step 6: Oracle submits attestation for the delayed transaction
    const signature = new Uint8Array(65).fill(1);
    const { result: attestResult } = simnet.callPublicFn(
      "oracle",
      "submit-attestation",
      [
        Cl.buffer(txHashBuffer),
        Cl.uint(BROADCAST_HEIGHT),
        Cl.uint(CONFIRMATION_HEIGHT),
        Cl.buffer(signature),
      ],
      oracle
    );
    expect(attestResult).toBeOk(Cl.uint(DELAY_BLOCKS));

    // Step 7: Verify attestation was recorded
    const { result: attestData } = simnet.callReadOnlyFn(
      "oracle",
      "get-attestation",
      [Cl.buffer(txHashBuffer)],
      deployer
    );
    
    // Attestation should exist (type is "some" for OptionalSome)
    expect(attestData.type).toBe("some");
    const attestation = attestData.value.value;
    expect(attestation["delay-blocks"]).toBeUint(DELAY_BLOCKS);
    expect(attestation["broadcast-height"]).toBeUint(BROADCAST_HEIGHT);
    expect(attestation["inclusion-height"]).toBeUint(CONFIRMATION_HEIGHT);

    // Step 8: User submits claim
    const { result: claimResult } = simnet.callPublicFn(
      "hyperinsure-core",
      "submit-claim",
      [
        Cl.stringAscii("mainnet-claim-001"),
        Cl.stringAscii("mainnet-purchase-001"),
        Cl.buffer(txHashBuffer),
        Cl.uint(DELAY_BLOCKS),
      ],
      user
    );
    expect(claimResult).toBeOk(Cl.stringAscii("mainnet-claim-001"));

    // Step 9: Verify claim details
    const { result: claimData } = simnet.callReadOnlyFn(
      "hyperinsure-core",
      "get-claim",
      [Cl.stringAscii("mainnet-claim-001")],
      deployer
    );
    
    expect(claimData.type).toBe("some");
    const claim = claimData.value.value;
    expect(claim["delay-blocks"]).toBeUint(DELAY_BLOCKS);
    expect(claim.status).toBeUint(1); // CLAIM_STATUS_PENDING

    // Step 10: Admin processes and pays the claim
    const { result: processResult } = simnet.callPublicFn(
      "hyperinsure-core",
      "process-claim",
      [
        Cl.stringAscii("mainnet-claim-001"),
        Cl.uint(2), // CLAIM_STATUS_APPROVED
      ],
      deployer
    );
    expect(processResult).toBeOk(Cl.stringAscii("mainnet-claim-001"));

    // Step 11: Verify claim was paid
    const { result: finalClaimData } = simnet.callReadOnlyFn(
      "hyperinsure-core",
      "get-claim",
      [Cl.stringAscii("mainnet-claim-001")],
      deployer
    );
    const finalClaim = finalClaimData.value.value;
    expect(finalClaim.status).toBeUint(4); // CLAIM_STATUS_PAID

    // Step 12: Verify total payouts increased
    const totalPayouts = simnet.getDataVar("hyperinsure-core", "total-payouts");
    expect(totalPayouts).toBeUint(10000000); // 10 STX payout

    console.log("\n✅ SUCCESS: Real Bitcoin mainnet transaction claim processed!");
    console.log(`📊 Transaction: ${REAL_TXID}`);
    console.log(`⏰ Delay: ${DELAY_BLOCKS} blocks (threshold: ${THRESHOLD})`);
    console.log(`💰 Payout: 10 STX`);
  });

  it("should verify transaction delay calculation", () => {
    const calculatedDelay = CONFIRMATION_HEIGHT - BROADCAST_HEIGHT;
    expect(calculatedDelay).toBe(DELAY_BLOCKS);
    expect(DELAY_BLOCKS).toBeGreaterThan(THRESHOLD);
    
    console.log("\n📈 Delay Analysis:");
    console.log(`   Broadcast Height: ${BROADCAST_HEIGHT}`);
    console.log(`   Confirmation Height: ${CONFIRMATION_HEIGHT}`);
    console.log(`   Delay: ${DELAY_BLOCKS} blocks`);
    console.log(`   Threshold: ${THRESHOLD} blocks`);
    console.log(`   Exceeded by: ${DELAY_BLOCKS - THRESHOLD} blocks ✅`);
  });

  it.skip("should fetch and verify real Bitcoin transaction data", async () => {
    // This test is skipped by default as it requires network access
    // Run with: npm test -- --run mainnet-btc-claim.test.ts
    
    console.log("\n🔍 Fetching real Bitcoin transaction data...");
    
    const txData = await getBitcoinTxData(REAL_TXID);
    
    console.log("\n📦 Transaction Data:");
    console.log(`   TxID: ${txData.txHash}`);
    console.log(`   Block Height: ${txData.blockHeight}`);
    console.log(`   Block Hash: ${txData.blockHash}`);
    console.log(`   Merkle Proof Position: ${txData.merkleProof.pos}`);
    console.log(`   Merkle Proof Hashes: ${txData.merkleProof.merkle.length}`);
    
    expect(txData.blockHeight).toBe(CONFIRMATION_HEIGHT);
    expect(txData.txHash.toLowerCase()).toBe(REAL_TXID.toLowerCase());
    expect(txData.merkleProof.merkle.length).toBeGreaterThan(0);
  });
});
