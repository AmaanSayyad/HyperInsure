import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/stacks/clarinet-js-sdk
*/

describe("Insurance Treasury v2 Contract", () => {
  beforeEach(() => {
    // Reset simnet state before each test
  });

  it("should allow authorized funders to fund the treasury", () => {
    const fundAmount = 1000000; // 1 STX in microSTX
    
    const { result } = simnet.callPublicFn(
      "insurance-treasury-v2",
      "fund-treasury",
      [Cl.uint(fundAmount)],
      deployer
    );
    
    expect(result).toBeOk(Cl.uint(fundAmount));
    
    // Check treasury balance
    const balance = simnet.callReadOnlyFn(
      "insurance-treasury-v2",
      "get-treasury-balance",
      [],
      deployer
    );
    
    expect(balance.result).toBeUint(fundAmount);
  });

  it("should reject funding from unauthorized users", () => {
    const fundAmount = 1000000;
    
    const { result } = simnet.callPublicFn(
      "insurance-treasury-v2",
      "fund-treasury",
      [Cl.uint(fundAmount)],
      address1
    );
    
    expect(result).toBeErr(Cl.uint(6)); // ERR_UNAUTHORIZED
  });

  it("should track total funded amount correctly", () => {
    const fundAmount1 = 1000000;
    const fundAmount2 = 500000;
    
    // First funding
    simnet.callPublicFn(
      "insurance-treasury-v2",
      "fund-treasury",
      [Cl.uint(fundAmount1)],
      deployer
    );
    
    // Second funding
    simnet.callPublicFn(
      "insurance-treasury-v2",
      "fund-treasury",
      [Cl.uint(fundAmount2)],
      deployer
    );
    
    const totalFunded = simnet.callReadOnlyFn(
      "insurance-treasury-v2",
      "get-total-funded",
      [],
      deployer
    );
    
    expect(totalFunded.result).toBeUint(fundAmount1 + fundAmount2);
  });

  it("should process payouts correctly", () => {
    const fundAmount = 2000000;
    const payoutAmount = 500000;
    
    // Fund treasury first
    simnet.callPublicFn(
      "insurance-treasury-v2",
      "fund-treasury",
      [Cl.uint(fundAmount)],
      deployer
    );
    
    // Process payout
    const { result } = simnet.callPublicFn(
      "insurance-treasury-v2",
      "payout-claim",
      [Cl.uint(1), Cl.principal(address1), Cl.uint(payoutAmount)],
      deployer
    );
    
    expect(result).toBeOk(Cl.uint(payoutAmount));
    
    // Check remaining balance
    const balance = simnet.callReadOnlyFn(
      "insurance-treasury-v2",
      "get-treasury-balance",
      [],
      deployer
    );
    
    expect(balance.result).toBeUint(fundAmount - payoutAmount);
    
    // Check total paid out
    const totalPaidOut = simnet.callReadOnlyFn(
      "insurance-treasury-v2",
      "get-total-paid-out",
      [],
      deployer
    );
    
    expect(totalPaidOut.result).toBeUint(payoutAmount);
  });

  it("should reject payouts when insufficient funds", () => {
    const fundAmount = 500000;
    const payoutAmount = 1000000; // More than funded
    
    // Fund treasury
    simnet.callPublicFn(
      "insurance-treasury-v2",
      "fund-treasury",
      [Cl.uint(fundAmount)],
      deployer
    );
    
    // Try to payout more than available
    const { result } = simnet.callPublicFn(
      "insurance-treasury-v2",
      "payout-claim",
      [Cl.uint(1), Cl.principal(address1), Cl.uint(payoutAmount)],
      deployer
    );
    
    expect(result).toBeErr(Cl.uint(1)); // ERR_INSUFFICIENT_FUNDS
  });

  it("should reject invalid amounts", () => {
    // Try to fund with zero amount
    const { result } = simnet.callPublicFn(
      "insurance-treasury-v2",
      "fund-treasury",
      [Cl.uint(0)],
      deployer
    );
    
    expect(result).toBeErr(Cl.uint(7)); // ERR_INVALID_AMOUNT
  });
});