import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const oracle1 = accounts.get("wallet_1")!;

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

  // Real Bitcoin transaction test (requires mainnet data)
  it.skip("should verify real Bitcoin transaction", () => {
    // This test requires actual Bitcoin transaction data
    // Example: Bitcoin block 883230, transaction from mempool.space
    
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

    // Real Bitcoin transaction data would go here
    // const txHash = Buffer.from("c1de234c01ecc47906117d012865ce3dabbbb081dc0309a74dbbae45e427aadc", "hex");
    // const tx = Buffer.from("...", "hex"); // Full transaction hex
    // const header = Buffer.from("...", "hex"); // Block header
    // const proof = { ... }; // Merkle proof
    
    // Submit with proof
    // const { result } = simnet.callPublicFn(...);
    // expect(result).toBeOk(...);
  });
});
