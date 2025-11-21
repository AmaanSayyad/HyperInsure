import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

describe("Claim Processor Contract", () => {
  beforeEach(() => {
    // Reset simnet state before each test
  });

  const createPolicy = (holder: string, coverage: number = 1000000, premium: number = 10000, duration: number = 1000) => {
    return simnet.callPublicFn(
      "policy-manager",
      "purchase-policy",
      [
        Cl.uint(coverage),
        Cl.uint(premium),
        Cl.uint(duration)
      ],
      holder
    );
  };

  it("should allow users to submit claims with valid evidence", () => {
    // First create a policy
    const policyResult = createPolicy(address1);
    expect(policyResult.result).toBeOk(Cl.uint(1));
    
    const policyId = 1;
    const txHex = new Uint8Array(100).fill(0x01); // Mock transaction hex
    const blockHeader = new Uint8Array(80).fill(0x02); // Mock block header
    const merkleProof = {
      "tx-index": Cl.uint(0),
      hashes: Cl.list([
        Cl.bufferFromHex("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
      ]),
      "tree-depth": Cl.uint(1)
    };
    
    const { result } = simnet.callPublicFn(
      "claim-processor",
      "submit-claim",
      [
        Cl.uint(policyId),
        Cl.buffer(txHex),
        Cl.buffer(blockHeader),
        Cl.tuple(merkleProof)
      ],
      address1
    );
    
    expect(result).toBeOk(Cl.uint(1)); // First claim ID should be 1
  });

  it("should store claim details correctly", () => {
    // First create a policy
    const policyResult = createPolicy(address1);
    expect(policyResult.result).toBeOk(Cl.uint(1));
    
    const policyId = 1;
    const txHex = new Uint8Array(100).fill(0x01);
    const blockHeader = new Uint8Array(80).fill(0x02);
    const merkleProof = {
      "tx-index": Cl.uint(0),
      hashes: Cl.list([
        Cl.bufferFromHex("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
      ]),
      "tree-depth": Cl.uint(1)
    };
    
    // Submit claim
    simnet.callPublicFn(
      "claim-processor",
      "submit-claim",
      [
        Cl.uint(policyId),
        Cl.buffer(txHex),
        Cl.buffer(blockHeader),
        Cl.tuple(merkleProof)
      ],
      address1
    );
    
    // Get claim details
    const claim = simnet.callReadOnlyFn(
      "claim-processor",
      "get-claim",
      [Cl.uint(1)],
      deployer
    );
    
    expect(claim.result).toBeSome(
      Cl.tuple({
        "policy-id": Cl.uint(policyId),
        submitter: Cl.principal(address1),
        "tx-hex": Cl.buffer(txHex),
        "block-header": Cl.buffer(blockHeader),
        "merkle-proof": Cl.tuple(merkleProof),
        status: Cl.stringAscii("pending"),
        "payout-amount": Cl.uint(0),
        "verified-tx-hash": Cl.none()
      })
    );
  });

  it("should prevent duplicate claims for the same policy", () => {
    // First create a policy
    const policyResult = createPolicy(address1);
    expect(policyResult.result).toBeOk(Cl.uint(1));
    
    const policyId = 1;
    const txHex = new Uint8Array(100).fill(0x01);
    const blockHeader = new Uint8Array(80).fill(0x02);
    const merkleProof = {
      "tx-index": Cl.uint(0),
      hashes: Cl.list([
        Cl.bufferFromHex("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
      ]),
      "tree-depth": Cl.uint(1)
    };
    
    // Submit first claim
    const { result: result1 } = simnet.callPublicFn(
      "claim-processor",
      "submit-claim",
      [
        Cl.uint(policyId),
        Cl.buffer(txHex),
        Cl.buffer(blockHeader),
        Cl.tuple(merkleProof)
      ],
      address1
    );
    
    expect(result1).toBeOk(Cl.uint(1));
    
    // Try to submit duplicate claim
    const { result: result2 } = simnet.callPublicFn(
      "claim-processor",
      "submit-claim",
      [
        Cl.uint(policyId),
        Cl.buffer(txHex),
        Cl.buffer(blockHeader),
        Cl.tuple(merkleProof)
      ],
      address1
    );
    
    expect(result2).toBeErr(Cl.uint(5)); // ERR_DUPLICATE_CLAIM
  });

  it("should reject claims with invalid evidence", () => {
    // First create a policy
    const policyResult = createPolicy(address1);
    expect(policyResult.result).toBeOk(Cl.uint(1));
    
    const policyId = 1;
    const emptyTxHex = new Uint8Array(0); // Invalid empty transaction
    const blockHeader = new Uint8Array(80).fill(0x02);
    const merkleProof = {
      "tx-index": Cl.uint(0),
      hashes: Cl.list([
        Cl.bufferFromHex("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
      ]),
      "tree-depth": Cl.uint(1)
    };
    
    const { result } = simnet.callPublicFn(
      "claim-processor",
      "submit-claim",
      [
        Cl.uint(policyId),
        Cl.buffer(emptyTxHex),
        Cl.buffer(blockHeader),
        Cl.tuple(merkleProof)
      ],
      address1
    );
    
    expect(result).toBeErr(Cl.uint(4)); // ERR_INVALID_PROOF
  });
});