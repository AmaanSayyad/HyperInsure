import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const oracle1 = accounts.get("wallet_1")!;
const oracle2 = accounts.get("wallet_2")!;
const user1 = accounts.get("wallet_3")!;
const user2 = accounts.get("wallet_4")!;

describe("HyperInsure Integration Tests", () => {
  
  describe("Complete Insurance Workflow", () => {
    it("should handle full policy lifecycle: create -> purchase -> claim -> payout", () => {
      // Step 0: Fund the contract with initial capital
      simnet.callPublicFn(
        "hyperinsure-core",
        "fund-contract",
        [Cl.uint(100000000)], // 100 STX
        deployer
      );

      // Step 1: Admin creates a policy
      const { result: createResult } = simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("btc-delay-policy"),
          Cl.stringAscii("Bitcoin Delay Insurance"),
          Cl.stringUtf8("Protection against Bitcoin transaction delays"),
          Cl.uint(10), // 10 blocks delay threshold
          Cl.uint(500), // 5% premium
          Cl.uint(100), // 1% protocol fee
          Cl.uint(5000000), // 5 STX payout
        ],
        deployer
      );
      expect(createResult).toBeOk(Cl.stringAscii("btc-delay-policy"));

      // Step 2: User purchases the policy
      const stxAmount = 10000000; // 10 STX
      const { result: purchaseResult } = simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("btc-delay-policy"),
          Cl.uint(stxAmount),
          Cl.stringAscii("purchase-001"),
        ],
        user1
      );
      expect(purchaseResult).toBeOk(Cl.stringAscii("purchase-001"));

      // Verify total deposits increased
      const totalDeposits = simnet.getDataVar("hyperinsure-core", "total-deposits");
      const expectedDeposits = 500000 + 100000; // premium + fee
      expect(totalDeposits).toBeUint(expectedDeposits);

      // Step 3: Oracle registers
      const publicKey = new Uint8Array(33).fill(1);
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Primary Oracle"),
          Cl.buffer(publicKey),
        ],
        deployer
      );

      // Step 4: Oracle submits attestation for delayed transaction
      const txHash = new Uint8Array(32).fill(1);
      const signature = new Uint8Array(65).fill(1);
      
      const { result: attestResult } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(883230), // Broadcast height
          Cl.uint(883245), // Inclusion height (15 blocks delay)
          Cl.buffer(signature),
        ],
        oracle1
      );
      expect(attestResult).toBeOk(Cl.uint(15)); // 15 blocks delay

      // Step 5: User submits claim
      const { result: claimResult } = simnet.callPublicFn(
        "hyperinsure-core",
        "submit-claim",
        [
          Cl.stringAscii("claim-001"),
          Cl.stringAscii("purchase-001"),
          Cl.buffer(txHash),
          Cl.uint(15), // Delay blocks
        ],
        user1
      );
      expect(claimResult).toBeOk(Cl.stringAscii("claim-001"));

      // Step 6: Admin processes claim
      const { result: processResult } = simnet.callPublicFn(
        "hyperinsure-core",
        "process-claim",
        [
          Cl.stringAscii("claim-001"),
          Cl.uint(2), // CLAIM_STATUS_APPROVED (status code is 2, not 1)
        ],
        deployer
      );
      expect(processResult).toBeOk(Cl.stringAscii("claim-001"));

      // Verify claim was processed
      const { result: claimData } = simnet.callReadOnlyFn(
        "hyperinsure-core",
        "get-claim",
        [Cl.stringAscii("claim-001")],
        deployer
      );
      
      const claim = claimData.value.value;
      expect(claim.status).toBeUint(4); // CLAIM_STATUS_PAID
    });

    it("should reject claim if delay is below threshold", () => {
      // Create policy with 10 blocks threshold
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("strict-policy"),
          Cl.stringAscii("Strict Policy"),
          Cl.stringUtf8("High threshold"),
          Cl.uint(20), // 20 blocks threshold
          Cl.uint(300),
          Cl.uint(100),
          Cl.uint(3000000),
        ],
        deployer
      );

      // Purchase policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("strict-policy"),
          Cl.uint(10000000),
          Cl.stringAscii("purchase-002"),
        ],
        user1
      );

      // Register oracle
      const publicKey = new Uint8Array(33).fill(2);
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Oracle"),
          Cl.buffer(publicKey),
        ],
        deployer
      );

      // Submit attestation with only 5 blocks delay (below 20 threshold)
      const txHash = new Uint8Array(32).fill(2);
      const signature = new Uint8Array(65).fill(2);
      
      simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(883230),
          Cl.uint(883235), // Only 5 blocks delay
          Cl.buffer(signature),
        ],
        oracle1
      );

      // Try to submit claim - should fail
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "submit-claim",
        [
          Cl.stringAscii("claim-002"),
          Cl.stringAscii("purchase-002"),
          Cl.buffer(txHash),
          Cl.uint(5), // Below threshold
        ],
        user1
      );
      
      expect(result).toBeErr(Cl.uint(6)); // ERR_INVALID_PARAMETER
    });
  });

  describe("Multi-Oracle Consensus", () => {
    it("should track attestations from multiple oracles", () => {
      // Register two oracles
      const publicKey1 = new Uint8Array(33).fill(1);
      const publicKey2 = new Uint8Array(33).fill(2);
      
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [Cl.principal(oracle1), Cl.stringAscii("Oracle 1"), Cl.buffer(publicKey1)],
        deployer
      );
      
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [Cl.principal(oracle2), Cl.stringAscii("Oracle 2"), Cl.buffer(publicKey2)],
        deployer
      );

      // Both oracles attest to different transactions
      const txHash1 = new Uint8Array(32).fill(1);
      const txHash2 = new Uint8Array(32).fill(2);
      const signature = new Uint8Array(65).fill(1);

      const { result: attest1 } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [Cl.buffer(txHash1), Cl.uint(883230), Cl.uint(883240), Cl.buffer(signature)],
        oracle1
      );
      expect(attest1).toBeOk(Cl.uint(10));

      const { result: attest2 } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [Cl.buffer(txHash2), Cl.uint(883230), Cl.uint(883250), Cl.buffer(signature)],
        oracle2
      );
      expect(attest2).toBeOk(Cl.uint(20));

      // Verify attestation count
      const attestationCount = simnet.getDataVar("oracle", "attestation-count");
      expect(attestationCount).toBeUint(2);
    });

    it("should prevent inactive oracle from submitting", () => {
      // Register oracle
      const publicKey = new Uint8Array(33).fill(3);
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [Cl.principal(oracle1), Cl.stringAscii("Oracle"), Cl.buffer(publicKey)],
        deployer
      );

      // Deactivate oracle
      simnet.callPublicFn(
        "oracle",
        "update-oracle-status",
        [Cl.principal(oracle1), Cl.bool(false)],
        deployer
      );

      // Try to submit attestation
      const txHash = new Uint8Array(32).fill(3);
      const signature = new Uint8Array(65).fill(3);
      
      const { result } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [Cl.buffer(txHash), Cl.uint(883230), Cl.uint(883240), Cl.buffer(signature)],
        oracle1
      );
      
      expect(result).toBeErr(Cl.uint(1)); // ERR_UNAUTHORIZED
    });
  });

  describe("Governance Integration", () => {
    it("should allow governance to update protocol parameters", () => {
      // Step 1: Create a governance proposal
      const { result: proposalResult } = simnet.callPublicFn(
        "governance",
        "create-proposal",
        [
          Cl.stringAscii("Update Delay Threshold"),
          Cl.stringUtf8("Increase default delay threshold to 50 blocks"),
          Cl.uint(1), // PROPOSAL_TYPE_PARAMETER
          Cl.some(Cl.stringAscii("default-delay-threshold")),
          Cl.some(Cl.uint(50)),
          Cl.none(),
          Cl.none(),
        ],
        user1
      );
      expect(proposalResult).toBeOk(Cl.uint(0)); // First proposal

      // Step 2: Users vote on proposal
      simnet.callPublicFn(
        "governance",
        "vote",
        [Cl.uint(0), Cl.uint(1)], // Vote FOR
        user1
      );

      simnet.callPublicFn(
        "governance",
        "vote",
        [Cl.uint(0), Cl.uint(1)], // Vote FOR
        user2
      );

      // Step 3: Check proposal vote counts
      const { result: proposalData } = simnet.callReadOnlyFn(
        "governance",
        "get-proposal",
        [Cl.uint(0)],
        deployer
      );
      
      const proposal = proposalData.value.value;
      expect(proposal["votes-for"]).toBeUint(2);
      expect(proposal["votes-against"]).toBeUint(0);
    });

    it("should track proposal lifecycle", () => {
      // Create proposal
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [
          Cl.stringAscii("Test Proposal"),
          Cl.stringUtf8("Testing lifecycle"),
          Cl.uint(1),
          Cl.none(),
          Cl.none(),
          Cl.none(),
          Cl.none(),
        ],
        user1
      );

      // Check proposal is active
      const { result: beforeCancel } = simnet.callReadOnlyFn(
        "governance",
        "get-proposal",
        [Cl.uint(0)],
        deployer
      );
      expect(beforeCancel.value.value.active).toBeBool(true);

      // Proposer cancels
      simnet.callPublicFn(
        "governance",
        "cancel-proposal",
        [Cl.uint(0)],
        user1
      );

      // Check proposal is inactive
      const { result: afterCancel } = simnet.callReadOnlyFn(
        "governance",
        "get-proposal",
        [Cl.uint(0)],
        deployer
      );
      expect(afterCancel.value.value.active).toBeBool(false);
    });
  });

  describe("Treasury Management", () => {
    it("should track deposits and payouts correctly", () => {
      // Fund the contract
      simnet.callPublicFn(
        "hyperinsure-core",
        "fund-contract",
        [Cl.uint(50000000)], // 50 STX
        deployer
      );

      // Create policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("treasury-test"),
          Cl.stringAscii("Treasury Test"),
          Cl.stringUtf8("Testing treasury"),
          Cl.uint(10),
          Cl.uint(200), // 2% premium
          Cl.uint(100), // 1% fee
          Cl.uint(2000000), // 2 STX payout
        ],
        deployer
      );

      const depositsBefore = simnet.getDataVar("hyperinsure-core", "total-deposits");
      const initialDeposits = BigInt(depositsBefore.value);

      // User purchases policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("treasury-test"),
          Cl.uint(10000000), // 10 STX
          Cl.stringAscii("treasury-purchase"),
        ],
        user1
      );

      // Verify deposits increased by premium + fee
      const depositsAfter = simnet.getDataVar("hyperinsure-core", "total-deposits");
      const premium = 200000n; // 2% of 10 STX
      const fee = 100000n; // 1% of 10 STX
      expect(depositsAfter).toBeUint(initialDeposits + premium + fee);

      // Register oracle and submit attestation
      const publicKey = new Uint8Array(33).fill(1);
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [Cl.principal(oracle1), Cl.stringAscii("Oracle"), Cl.buffer(publicKey)],
        deployer
      );

      const txHash = new Uint8Array(32).fill(1);
      const signature = new Uint8Array(65).fill(1);
      simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [Cl.buffer(txHash), Cl.uint(883230), Cl.uint(883245), Cl.buffer(signature)],
        oracle1
      );

      // Submit and approve claim
      simnet.callPublicFn(
        "hyperinsure-core",
        "submit-claim",
        [
          Cl.stringAscii("treasury-claim"),
          Cl.stringAscii("treasury-purchase"),
          Cl.buffer(txHash),
          Cl.uint(15),
        ],
        user1
      );

      const { result: processResult } = simnet.callPublicFn(
        "hyperinsure-core",
        "process-claim",
        [Cl.stringAscii("treasury-claim"), Cl.uint(2)], // CLAIM_STATUS_APPROVED is 2
        deployer
      );
      expect(processResult).toBeOk(Cl.stringAscii("treasury-claim"));

      // Verify total payouts increased
      const totalPayouts = simnet.getDataVar("hyperinsure-core", "total-payouts");
      expect(totalPayouts).toBeUint(2000000);
    });

    it("should maintain reserve ratio", () => {
      // Set reserve ratio to 50%
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "set-reserve-ratio",
        [Cl.uint(5000)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      const reserveRatio = simnet.getDataVar("hyperinsure-core", "reserve-ratio");
      expect(reserveRatio).toBeUint(5000);
    });
  });

  describe("Cross-Contract Interactions", () => {
    it("should coordinate between oracle and core contracts", () => {
      // Setup: Create policy and purchase
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("cross-test"),
          Cl.stringAscii("Cross Test"),
          Cl.stringUtf8("Testing cross-contract"),
          Cl.uint(15),
          Cl.uint(200),
          Cl.uint(100),
          Cl.uint(3000000),
        ],
        deployer
      );

      simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("cross-test"),
          Cl.uint(10000000),
          Cl.stringAscii("cross-purchase"),
        ],
        user1
      );

      // Register oracle
      const publicKey = new Uint8Array(33).fill(1);
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [Cl.principal(oracle1), Cl.stringAscii("Oracle"), Cl.buffer(publicKey)],
        deployer
      );

      // Oracle submits attestation
      const txHash = new Uint8Array(32).fill(1);
      const signature = new Uint8Array(65).fill(1);
      
      simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [Cl.buffer(txHash), Cl.uint(883230), Cl.uint(883250), Cl.buffer(signature)],
        oracle1
      );

      // Verify attestation exists in oracle contract
      const { result: attestation } = simnet.callReadOnlyFn(
        "oracle",
        "get-attestation",
        [Cl.buffer(txHash)],
        deployer
      );
      expect(attestation.value).not.toBeUndefined();

      // Core contract can read attestation
      const attData = attestation.value.value;
      expect(attData["delay-blocks"]).toBeUint(20);
      expect(attData["oracle-id"]).toBePrincipal(oracle1);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should prevent duplicate purchases with same ID", () => {
      // Create policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("dup-test"),
          Cl.stringAscii("Duplicate Test"),
          Cl.stringUtf8("Testing duplicates"),
          Cl.uint(10),
          Cl.uint(200),
          Cl.uint(100),
          Cl.uint(1000000),
        ],
        deployer
      );

      // First purchase
      const { result: first } = simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("dup-test"),
          Cl.uint(10000000),
          Cl.stringAscii("same-id"),
        ],
        user1
      );
      expect(first).toBeOk(Cl.stringAscii("same-id"));

      // Second purchase with same ID - should fail
      const { result: second } = simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("dup-test"),
          Cl.uint(10000000),
          Cl.stringAscii("same-id"),
        ],
        user1
      );
      expect(second).toBeErr(Cl.uint(9)); // ERR_PURCHASE_EXISTS
    });

    it("should prevent duplicate attestations", () => {
      // Register oracle
      const publicKey = new Uint8Array(33).fill(1);
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [Cl.principal(oracle1), Cl.stringAscii("Oracle"), Cl.buffer(publicKey)],
        deployer
      );

      const txHash = new Uint8Array(32).fill(1);
      const signature = new Uint8Array(65).fill(1);

      // First attestation
      const { result: first } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [Cl.buffer(txHash), Cl.uint(883230), Cl.uint(883240), Cl.buffer(signature)],
        oracle1
      );
      expect(first).toBeOk(Cl.uint(10));

      // Second attestation with same tx-hash - should fail
      const { result: second } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [Cl.buffer(txHash), Cl.uint(883230), Cl.uint(883240), Cl.buffer(signature)],
        oracle1
      );
      expect(second).toBeErr(Cl.uint(4)); // ERR_ATTESTATION_EXISTS
    });

    it("should handle expired policies", () => {
      // Create policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("expire-test"),
          Cl.stringAscii("Expiry Test"),
          Cl.stringUtf8("Testing expiry"),
          Cl.uint(10),
          Cl.uint(200),
          Cl.uint(100),
          Cl.uint(1000000),
        ],
        deployer
      );

      // Purchase policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("expire-test"),
          Cl.uint(10000000),
          Cl.stringAscii("expire-purchase"),
        ],
        user1
      );

      // Mine blocks to expire the purchase (1008 blocks = ~1 week)
      simnet.mineEmptyBlocks(1010);

      // Register oracle and submit attestation
      const publicKey = new Uint8Array(33).fill(1);
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [Cl.principal(oracle1), Cl.stringAscii("Oracle"), Cl.buffer(publicKey)],
        deployer
      );

      const txHash = new Uint8Array(32).fill(1);
      const signature = new Uint8Array(65).fill(1);
      simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [Cl.buffer(txHash), Cl.uint(883230), Cl.uint(883245), Cl.buffer(signature)],
        oracle1
      );

      // Try to submit claim on expired purchase - should fail
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "submit-claim",
        [
          Cl.stringAscii("expire-claim"),
          Cl.stringAscii("expire-purchase"),
          Cl.buffer(txHash),
          Cl.uint(15),
        ],
        user1
      );
      expect(result).toBeErr(Cl.uint(10)); // ERR_PURCHASE_EXPIRED
    });
  });

  describe("System State Consistency", () => {
    it("should maintain consistent counters across operations", () => {
      // Initial state
      const initialPurchases = simnet.getDataVar("hyperinsure-core", "purchase-count");
      const initialOracles = simnet.getDataVar("oracle", "oracle-count");
      const initialAttestations = simnet.getDataVar("oracle", "attestation-count");

      // Create policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("counter-test"),
          Cl.stringAscii("Counter Test"),
          Cl.stringUtf8("Testing counters"),
          Cl.uint(10),
          Cl.uint(200),
          Cl.uint(100),
          Cl.uint(1000000),
        ],
        deployer
      );

      // Make 3 purchases
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          "hyperinsure-core",
          "purchase-policy",
          [
            Cl.stringAscii("counter-test"),
            Cl.uint(10000000),
            Cl.stringAscii(`purchase-${i}`),
          ],
          user1
        );
      }

      // Register 2 oracles
      for (let i = 0; i < 2; i++) {
        const publicKey = new Uint8Array(33).fill(i + 1);
        simnet.callPublicFn(
          "oracle",
          "register-oracle",
          [
            Cl.principal(i === 0 ? oracle1 : oracle2),
            Cl.stringAscii(`Oracle ${i + 1}`),
            Cl.buffer(publicKey),
          ],
          deployer
        );
      }

      // Submit 2 attestations
      for (let i = 0; i < 2; i++) {
        const txHash = new Uint8Array(32).fill(i + 1);
        const signature = new Uint8Array(65).fill(i + 1);
        simnet.callPublicFn(
          "oracle",
          "submit-attestation",
          [
            Cl.buffer(txHash),
            Cl.uint(883230),
            Cl.uint(883240 + i * 5),
            Cl.buffer(signature),
          ],
          i === 0 ? oracle1 : oracle2
        );
      }

      // Verify all counters increased correctly
      const finalPurchases = simnet.getDataVar("hyperinsure-core", "purchase-count");
      const finalOracles = simnet.getDataVar("oracle", "oracle-count");
      const finalAttestations = simnet.getDataVar("oracle", "attestation-count");

      expect(finalPurchases).toBeUint(BigInt(initialPurchases.value) + 3n);
      expect(finalOracles).toBeUint(BigInt(initialOracles.value) + 2n);
      expect(finalAttestations).toBeUint(BigInt(initialAttestations.value) + 2n);
    });
  });
});
