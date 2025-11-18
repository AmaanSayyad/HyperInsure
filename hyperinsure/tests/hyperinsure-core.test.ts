import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("HyperInsure Core Contract Tests", () => {
  
  describe("Policy Management", () => {
    it("admin can create a policy", () => {
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("policy-1"),
          Cl.stringAscii("Basic Coverage"),
          Cl.stringUtf8("Protection against transaction delays"),
          Cl.uint(35), // delay-threshold
          Cl.uint(200), // premium-percentage (2%)
          Cl.uint(100), // protocol-fee (1%)
          Cl.uint(1000000), // payout-per-incident (1 STX)
        ],
        deployer
      );
      
      expect(result).toBeOk(Cl.stringAscii("policy-1"));
    });

    it("non-admin cannot create a policy", () => {
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("policy-2"),
          Cl.stringAscii("Premium Coverage"),
          Cl.stringUtf8("Premium protection"),
          Cl.uint(50),
          Cl.uint(300),
          Cl.uint(150),
          Cl.uint(2000000),
        ],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(1)); // ERR_UNAUTHORIZED
    });

    it("cannot create duplicate policy", () => {
      // Create first policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("policy-dup"),
          Cl.stringAscii("Test Policy"),
          Cl.stringUtf8("Test"),
          Cl.uint(35),
          Cl.uint(200),
          Cl.uint(100),
          Cl.uint(1000000),
        ],
        deployer
      );

      // Try to create duplicate
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("policy-dup"),
          Cl.stringAscii("Duplicate Policy"),
          Cl.stringUtf8("Duplicate"),
          Cl.uint(40),
          Cl.uint(250),
          Cl.uint(120),
          Cl.uint(1500000),
        ],
        deployer
      );
      
      expect(result).toBeErr(Cl.uint(2)); // ERR_POLICY_EXISTS
    });

    it("validates policy parameters", () => {
      // Invalid delay threshold (0)
      const { result: result1 } = simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("invalid-1"),
          Cl.stringAscii("Invalid Policy"),
          Cl.stringUtf8("Invalid"),
          Cl.uint(0), // Invalid
          Cl.uint(200),
          Cl.uint(100),
          Cl.uint(1000000),
        ],
        deployer
      );
      expect(result1).toBeErr(Cl.uint(6)); // ERR_INVALID_PARAMETER

      // Invalid premium percentage (> 10000)
      const { result: result2 } = simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("invalid-2"),
          Cl.stringAscii("Invalid Policy"),
          Cl.stringUtf8("Invalid"),
          Cl.uint(35),
          Cl.uint(10001), // Invalid
          Cl.uint(100),
          Cl.uint(1000000),
        ],
        deployer
      );
      expect(result2).toBeErr(Cl.uint(6)); // ERR_INVALID_PARAMETER
    });

    it("can read policy details", () => {
      // Create policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("read-test"),
          Cl.stringAscii("Read Test Policy"),
          Cl.stringUtf8("Testing read"),
          Cl.uint(35),
          Cl.uint(200),
          Cl.uint(100),
          Cl.uint(1000000),
        ],
        deployer
      );

      // Read policy
      const { result } = simnet.callReadOnlyFn(
        "hyperinsure-core",
        "get-policy",
        [Cl.stringAscii("read-test")],
        deployer
      );
      
      const policy = result.value.value;
      expect(policy.name).toBeAscii("Read Test Policy");
      expect(policy["delay-threshold"]).toBeUint(35);
      expect(policy["premium-percentage"]).toBeUint(200);
      expect(policy.active).toBeBool(true);
    });

    it("admin can update policy status", () => {
      // Create policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("status-test"),
          Cl.stringAscii("Status Test"),
          Cl.stringUtf8("Testing status"),
          Cl.uint(35),
          Cl.uint(200),
          Cl.uint(100),
          Cl.uint(1000000),
        ],
        deployer
      );

      // Deactivate policy
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "update-policy-status",
        [Cl.stringAscii("status-test"), Cl.bool(false)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));

      // Verify status changed
      const { result: policyResult } = simnet.callReadOnlyFn(
        "hyperinsure-core",
        "get-policy",
        [Cl.stringAscii("status-test")],
        deployer
      );
      
      const policy = policyResult.value.value;
      expect(policy.active).toBeBool(false);
    });
  });

  describe("Policy Purchase", () => {
    beforeEach(() => {
      // Create a test policy before each purchase test
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("test-policy"),
          Cl.stringAscii("Test Policy"),
          Cl.stringUtf8("Test coverage"),
          Cl.uint(35),
          Cl.uint(200), // 2% premium
          Cl.uint(100), // 1% fee
          Cl.uint(1000000),
        ],
        deployer
      );
    });

    it("user can purchase policy", () => {
      const stxAmount = 10000000; // 10 STX
      
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("test-policy"),
          Cl.uint(stxAmount),
          Cl.stringAscii("purchase-1"),
        ],
        wallet1
      );
      
      expect(result).toBeOk(Cl.stringAscii("purchase-1"));
    });

    it("calculates premium correctly", () => {
      const stxAmount = 10000000; // 10 STX
      
      const { result } = simnet.callReadOnlyFn(
        "hyperinsure-core",
        "calculate-premium",
        [Cl.stringAscii("test-policy"), Cl.uint(stxAmount)],
        wallet1
      );
      
      // 2% of 10 STX = 0.2 STX = 200000 microSTX
      expect(result).toBeUint(200000);
    });

    it("calculates fee correctly", () => {
      const stxAmount = 10000000; // 10 STX
      
      const { result } = simnet.callReadOnlyFn(
        "hyperinsure-core",
        "calculate-fee",
        [Cl.stringAscii("test-policy"), Cl.uint(stxAmount)],
        wallet1
      );
      
      // 1% of 10 STX = 0.1 STX = 100000 microSTX
      expect(result).toBeUint(100000);
    });

    it("cannot purchase inactive policy", () => {
      // Deactivate policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "update-policy-status",
        [Cl.stringAscii("test-policy"), Cl.bool(false)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("test-policy"),
          Cl.uint(10000000),
          Cl.stringAscii("purchase-fail"),
        ],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(11)); // ERR_POLICY_INACTIVE
    });

    it("tracks purchase count", () => {
      const countBefore = simnet.getDataVar("hyperinsure-core", "purchase-count");
      const initialCount = BigInt(countBefore.value);

      // Make purchase
      simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("test-policy"),
          Cl.uint(10000000),
          Cl.stringAscii("purchase-count-test"),
        ],
        wallet1
      );

      const countAfter = simnet.getDataVar("hyperinsure-core", "purchase-count");
      
      expect(countAfter).toBeUint(initialCount + 1n);
    });
  });

  describe("Treasury Management", () => {
    it("tracks total deposits", () => {
      // Create policy
      simnet.callPublicFn(
        "hyperinsure-core",
        "create-policy",
        [
          Cl.stringAscii("treasury-test"),
          Cl.stringAscii("Treasury Test"),
          Cl.stringUtf8("Test"),
          Cl.uint(35),
          Cl.uint(200),
          Cl.uint(100),
          Cl.uint(1000000),
        ],
        deployer
      );

      const depositsBefore = simnet.getDataVar("hyperinsure-core", "total-deposits");
      const initialDeposits = BigInt(depositsBefore.value);

      // Purchase policy (deposits premium + fee)
      simnet.callPublicFn(
        "hyperinsure-core",
        "purchase-policy",
        [
          Cl.stringAscii("treasury-test"),
          Cl.uint(10000000),
          Cl.stringAscii("treasury-purchase"),
        ],
        wallet1
      );

      const depositsAfter = simnet.getDataVar("hyperinsure-core", "total-deposits");
      
      // Should increase by premium (200000) + fee (100000) = 300000
      expect(depositsAfter).toBeUint(initialDeposits + 300000n);
    });

    it("admin can set reserve ratio", () => {
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "set-reserve-ratio",
        [Cl.uint(6000)], // 60%
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));

      const ratio = simnet.getDataVar("hyperinsure-core", "reserve-ratio");
      expect(ratio).toBeUint(6000);
    });
  });

  describe("Admin Functions", () => {
    it("admin can change admin", () => {
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "set-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));

      const newAdmin = simnet.getDataVar("hyperinsure-core", "admin");
      expect(newAdmin).toBePrincipal(wallet1);
    });

    it("non-admin cannot change admin", () => {
      const { result } = simnet.callPublicFn(
        "hyperinsure-core",
        "set-admin",
        [Cl.principal(wallet2)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(1)); // ERR_UNAUTHORIZED
    });
  });
});







