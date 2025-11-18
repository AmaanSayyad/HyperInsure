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
