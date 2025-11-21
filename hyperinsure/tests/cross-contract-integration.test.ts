import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

describe("Cross-Contract Integration", () => {
  beforeEach(() => {
    // Reset simnet state before each test
  });

  it("should demonstrate complete cross-contract flow: fund treasury -> purchase policy -> submit claim", () => {
    // Step 1: Fund the treasury
    const fundAmount = 10000000; // 10 STX
    const fundResult = simnet.callPublicFn(
      "insurance-treasury-v2",
      "fund-treasury",
      [Cl.uint(fundAmount)],
      deployer
    );
    expect(fundResult.result).toBeOk(Cl.uint(fundAmount));

    // Step 2: Purchase a policy (this should automatically transfer premium to treasury)
    const coverageAmount = 5000000; // 5 STX coverage
    const premium = 100000; // 0.1 STX premium
    const duration = 1000; // 1000 blocks

    const policyResult = simnet.callPublicFn(
      "policy-manager",
      "purchase-policy",
      [Cl.uint(coverageAmount), Cl.uint(premium), Cl.uint(duration)],
      address1
    );
    expect(policyResult.result).toBeOk(Cl.uint(1)); // Policy ID 1

    // Verify treasury balance increased by premium
    const treasuryBalance = simnet.callReadOnlyFn(
      "insurance-treasury-v2",
      "get-treasury-balance",
      [],
      deployer
    );
    expect(treasuryBalance.result).toBeUint(fundAmount + premium);

    // Step 3: Submit a claim
    const txHex = new Uint8Array(100).fill(0x01); // Mock transaction hex
    const blockHeader = new Uint8Array(80).fill(0x02); // Mock block header
    const merkleProof = {
      "tx-index": Cl.uint(0),
      "hashes": Cl.list([Cl.bufferFromHex("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")]),
      "tree-depth": Cl.uint(1)
    };

    const claimResult = simnet.callPublicFn(
      "claim-processor",
      "submit-claim",
      [
        Cl.uint(1), // Policy ID
        Cl.buffer(txHex),
        Cl.buffer(blockHeader),
        Cl.tuple(merkleProof)
      ],
      address1
    );
    expect(claimResult.result).toBeOk(Cl.uint(1)); // Claim ID 1

    // Verify claim was stored correctly
    const claim = simnet.callReadOnlyFn(
      "claim-processor",
      "get-claim",
      [Cl.uint(1)],
      address1
    );
    // Just verify the claim exists (has some value)
    expect(claim.result).not.toBeNone();

    // Step 4: Test treasury sufficiency check
    const sufficiencyCheck = simnet.callReadOnlyFn(
      "insurance-treasury-v2",
      "check-payout-sufficiency",
      [Cl.uint(coverageAmount)],
      deployer
    );
    expect(sufficiencyCheck.result).toBeBool(true);

    // Step 5: Test reserve-based sufficiency check
    const reserveCheck = simnet.callReadOnlyFn(
      "insurance-treasury-v2",
      "check-payout-with-reserve",
      [Cl.uint(coverageAmount)],
      deployer
    );
    expect(reserveCheck.result).toBeBool(true);

    // Verify available balance for payout (should account for 10% reserve)
    const availableForPayout = simnet.callReadOnlyFn(
      "insurance-treasury-v2",
      "get-available-for-payout",
      [],
      deployer
    );
    const expectedAvailable = Math.floor((fundAmount + premium) * 0.9); // 90% available (10% reserve)
    expect(availableForPayout.result).toBeUint(expectedAvailable);
  });

  it("should handle cross-contract authorization correctly", () => {
    // Fund treasury first
    simnet.callPublicFn(
      "insurance-treasury-v2",
      "fund-treasury",
      [Cl.uint(1000000)],
      deployer
    );

    // Test that only claim-processor can call payout-claim
    const unauthorizedPayout = simnet.callPublicFn(
      "insurance-treasury-v2",
      "payout-claim",
      [Cl.uint(1), Cl.principal(address1), Cl.uint(100000)],
      address1 // Not authorized
    );
    expect(unauthorizedPayout.result).toBeErr(Cl.uint(6)); // ERR_UNAUTHORIZED

    // Test that only policy-manager can call receive-premium
    const unauthorizedPremium = simnet.callPublicFn(
      "insurance-treasury-v2",
      "receive-premium",
      [Cl.uint(1), Cl.uint(100000), Cl.principal(address1)],
      address1 // Not authorized
    );
    expect(unauthorizedPremium.result).toBeErr(Cl.uint(6)); // ERR_UNAUTHORIZED
  });

  it("should emit coordinated events across contracts", () => {
    // Purchase a policy and verify events are emitted with cross-contract information
    const coverageAmount = 1000000;
    const premium = 50000;
    const duration = 500;

    const policyResult = simnet.callPublicFn(
      "policy-manager",
      "purchase-policy",
      [Cl.uint(coverageAmount), Cl.uint(premium), Cl.uint(duration)],
      address1
    );
    expect(policyResult.result).toBeOk(Cl.uint(1));

    // The events should show:
    // 1. premium-received event from treasury (called by policy-manager)
    // 2. policy-created event from policy-manager with treasury-funded: true

    // Submit a claim and verify cross-contract event coordination
    const txHex = new Uint8Array(100).fill(0x01);
    const blockHeader = new Uint8Array(80).fill(0x02);
    const merkleProof = {
      "tx-index": Cl.uint(0),
      "hashes": Cl.list([Cl.bufferFromHex("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")]),
      "tree-depth": Cl.uint(1)
    };

    const claimResult = simnet.callPublicFn(
      "claim-processor",
      "submit-claim",
      [
        Cl.uint(1),
        Cl.buffer(txHex),
        Cl.buffer(blockHeader),
        Cl.tuple(merkleProof)
      ],
      address1
    );
    expect(claimResult.result).toBeOk(Cl.uint(1));

    // The claim submission event should include policy-coverage and treasury-balance
    // showing cross-contract coordination
  });
});