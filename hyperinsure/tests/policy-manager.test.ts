import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

describe("Policy Manager Contract", () => {
  beforeEach(() => {
    // Reset simnet state before each test
  });

  it("should allow users to purchase insurance policies", () => {
    const coverageAmount = 5000000; // 5 STX coverage
    const premium = 100000; // 0.1 STX premium
    const duration = 1000; // 1000 blocks duration
    
    const { result } = simnet.callPublicFn(
      "policy-manager",
      "purchase-policy",
      [
        Cl.uint(coverageAmount),
        Cl.uint(premium),
        Cl.uint(duration)
      ],
      address1
    );
    
    expect(result).toBeOk(Cl.uint(1)); // First policy ID should be 1
  });

  it("should store policy details correctly", () => {
    const coverageAmount = 5000000;
    const premium = 100000;
    const duration = 1000;
    
    // Purchase policy
    simnet.callPublicFn(
      "policy-manager",
      "purchase-policy",
      [
        Cl.uint(coverageAmount),
        Cl.uint(premium),
        Cl.uint(duration)
      ],
      address1
    );
    
    // Get policy details
    const policy = simnet.callReadOnlyFn(
      "policy-manager",
      "get-policy",
      [Cl.uint(1)],
      deployer
    );
    
    expect(policy.result).toBeSome(
      Cl.tuple({
        holder: Cl.principal(address1),
        "coverage-amount": Cl.uint(coverageAmount),
        "premium-paid": Cl.uint(premium),
        "start-block": Cl.uint(simnet.blockHeight),
        "end-block": Cl.uint(simnet.blockHeight + duration),
        status: Cl.stringAscii("active")
      })
    );
  });

  it("should correctly identify active policies", () => {
    const coverageAmount = 5000000;
    const premium = 100000;
    const duration = 1000;
    
    // Purchase policy
    simnet.callPublicFn(
      "policy-manager",
      "purchase-policy",
      [
        Cl.uint(coverageAmount),
        Cl.uint(premium),
        Cl.uint(duration)
      ],
      address1
    );
    
    // Check if policy is active
    const isActive = simnet.callReadOnlyFn(
      "policy-manager",
      "is-policy-active",
      [Cl.uint(1)],
      deployer
    );
    
    expect(isActive.result).toBeBool(true);
  });

  it("should reject invalid policy parameters", () => {
    // Test with zero coverage amount
    const { result: result1 } = simnet.callPublicFn(
      "policy-manager",
      "purchase-policy",
      [
        Cl.uint(0), // Invalid coverage amount
        Cl.uint(100000),
        Cl.uint(1000)
      ],
      address1
    );
    
    expect(result1).toBeErr(Cl.uint(7)); // ERR_INVALID_AMOUNT
    
    // Test with zero premium
    const { result: result2 } = simnet.callPublicFn(
      "policy-manager",
      "purchase-policy",
      [
        Cl.uint(5000000),
        Cl.uint(0), // Invalid premium
        Cl.uint(1000)
      ],
      address1
    );
    
    expect(result2).toBeErr(Cl.uint(7)); // ERR_INVALID_AMOUNT
  });
});