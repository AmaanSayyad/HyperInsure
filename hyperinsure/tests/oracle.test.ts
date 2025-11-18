import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const oracle1 = accounts.get("wallet_1")!;
const oracle2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Oracle Contract Tests", () => {
  
  describe("Oracle Registration", () => {
    it("admin can register an oracle", () => {
      const publicKey = new Uint8Array(33).fill(1); // Mock public key
      
      const { result } = simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Oracle Node 1"),
          Cl.buffer(publicKey),
        ],
        deployer
      );
      
      expect(result).toBeOk(Cl.principal(oracle1));
    });

    it("non-admin cannot register oracle", () => {
      const publicKey = new Uint8Array(33).fill(2);
      
      const { result } = simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle2),
          Cl.stringAscii("Oracle Node 2"),
          Cl.buffer(publicKey),
        ],
        wallet3
      );
      
      expect(result).toBeErr(Cl.uint(1)); // ERR_UNAUTHORIZED
    });

    it("cannot register duplicate oracle", () => {
      const publicKey = new Uint8Array(33).fill(3);
      
      // Register first time
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Oracle Node 1"),
          Cl.buffer(publicKey),
        ],
        deployer
      );

      // Try to register again
      const { result } = simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Oracle Node 1 Duplicate"),
          Cl.buffer(publicKey),
        ],
        deployer
      );
      
      expect(result).toBeErr(Cl.uint(2)); // ERR_ORACLE_EXISTS
    });

    it("can read oracle details", () => {
      const publicKey = new Uint8Array(33).fill(4);
      
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Test Oracle"),
          Cl.buffer(publicKey),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "oracle",
        "get-oracle",
        [Cl.principal(oracle1)],
        deployer
      );
      
      const oracleData = result.value.value;
      expect(oracleData.name).toBeAscii("Test Oracle");
      expect(oracleData.active).toBeBool(true);
    });

    it("admin can update oracle status", () => {
      const publicKey = new Uint8Array(33).fill(5);
      
      // Register oracle
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Status Test Oracle"),
          Cl.buffer(publicKey),
        ],
        deployer
      );

      // Deactivate oracle
      const { result } = simnet.callPublicFn(
        "oracle",
        "update-oracle-status",
        [Cl.principal(oracle1), Cl.bool(false)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));

      // Verify status changed
      const { result: oracleResult } = simnet.callReadOnlyFn(
        "oracle",
        "get-oracle",
        [Cl.principal(oracle1)],
        deployer
      );
      
      const oracleData = oracleResult.value.value;
      expect(oracleData.active).toBeBool(false);
    });

    it("tracks oracle count", () => {
      const countBefore = simnet.getDataVar("oracle", "oracle-count");
      const initialCount = BigInt(countBefore.value);

      // Register oracle
      const publicKey = new Uint8Array(33).fill(6);
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Count Test Oracle"),
          Cl.buffer(publicKey),
        ],
        deployer
      );

      const countAfter = simnet.getDataVar("oracle", "oracle-count");
      expect(countAfter).toBeUint(initialCount + 1n);
    });
  });

  describe("Attestation Submission", () => {
    beforeEach(() => {
      // Register oracle before each test
      const publicKey = new Uint8Array(33).fill(10);
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Test Oracle"),
          Cl.buffer(publicKey),
        ],
        deployer
      );
    });

    it("active oracle can submit attestation", () => {
      const txHash = new Uint8Array(32).fill(1);
      const signature = new Uint8Array(65).fill(1);
      
      const { result } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(100), // broadcast-height
          Cl.uint(150), // inclusion-height
          Cl.buffer(signature),
        ],
        oracle1
      );
      
      expect(result).toBeOk(Cl.uint(50)); // delay-blocks = 150 - 100
    });

    it("non-oracle cannot submit attestation", () => {
      const txHash = new Uint8Array(32).fill(2);
      const signature = new Uint8Array(65).fill(2);
      
      const { result } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(100),
          Cl.uint(150),
          Cl.buffer(signature),
        ],
        wallet3
      );
      
      expect(result).toBeErr(Cl.uint(3)); // ERR_ORACLE_NOT_FOUND
    });

    it("inactive oracle cannot submit attestation", () => {
      // Deactivate oracle
      simnet.callPublicFn(
        "oracle",
        "update-oracle-status",
        [Cl.principal(oracle1), Cl.bool(false)],
        deployer
      );

      const txHash = new Uint8Array(32).fill(3);
      const signature = new Uint8Array(65).fill(3);
      
      const { result } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(100),
          Cl.uint(150),
          Cl.buffer(signature),
        ],
        oracle1
      );
      
      expect(result).toBeErr(Cl.uint(1)); // ERR_UNAUTHORIZED
    });

    it("validates block heights", () => {
      const txHash = new Uint8Array(32).fill(4);
      const signature = new Uint8Array(65).fill(4);
      
      // inclusion-height < broadcast-height (invalid)
      const { result } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(150),
          Cl.uint(100), // Invalid: less than broadcast
          Cl.buffer(signature),
        ],
        oracle1
      );
      
      expect(result).toBeErr(Cl.uint(7)); // ERR_INVALID_BLOCKS
    });

    it("cannot submit duplicate attestation", () => {
      const txHash = new Uint8Array(32).fill(5);
      const signature = new Uint8Array(65).fill(5);
      
      // Submit first time
      simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(100),
          Cl.uint(150),
          Cl.buffer(signature),
        ],
        oracle1
      );

      // Try to submit again
      const { result } = simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(100),
          Cl.uint(150),
          Cl.buffer(signature),
        ],
        oracle1
      );
      
      expect(result).toBeErr(Cl.uint(4)); // ERR_ATTESTATION_EXISTS
    });

    it("can read attestation details", () => {
      const txHash = new Uint8Array(32).fill(6);
      const signature = new Uint8Array(65).fill(6);
      
      simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(100),
          Cl.uint(145),
          Cl.buffer(signature),
        ],
        oracle1
      );

      const { result } = simnet.callReadOnlyFn(
        "oracle",
        "get-attestation",
        [Cl.buffer(txHash)],
        deployer
      );
      
      const attestation = result.value.value;
      expect(attestation["broadcast-height"]).toBeUint(100);
      expect(attestation["inclusion-height"]).toBeUint(145);
      expect(attestation["delay-blocks"]).toBeUint(45);
    });

    it("calculates delay correctly", () => {
      const { result } = simnet.callReadOnlyFn(
        "oracle",
        "calculate-delay",
        [Cl.uint(100), Cl.uint(175)],
        deployer
      );
      
      expect(result).toBeUint(75);
    });

    it("tracks attestation count", () => {
      const countBefore = simnet.getDataVar("oracle", "attestation-count");
      const initialCount = BigInt(countBefore.value);

      // Submit attestation
      const txHash = new Uint8Array(32).fill(7);
      const signature = new Uint8Array(65).fill(7);
      simnet.callPublicFn(
        "oracle",
        "submit-attestation",
        [
          Cl.buffer(txHash),
          Cl.uint(100),
          Cl.uint(150),
          Cl.buffer(signature),
        ],
        oracle1
      );

      const countAfter = simnet.getDataVar("oracle", "attestation-count");
      expect(countAfter).toBeUint(initialCount + 1n);
    });
  });

  describe("Helper Functions", () => {
    it("is-oracle returns true for active oracle", () => {
      const publicKey = new Uint8Array(33).fill(20);
      
      simnet.callPublicFn(
        "oracle",
        "register-oracle",
        [
          Cl.principal(oracle1),
          Cl.stringAscii("Helper Test Oracle"),
          Cl.buffer(publicKey),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "oracle",
        "is-oracle",
        [Cl.principal(oracle1)],
        deployer
      );
      
      expect(result).toBeBool(true);
    });

    it("is-oracle returns false for non-oracle", () => {
      const { result } = simnet.callReadOnlyFn(
        "oracle",
        "is-oracle",
        [Cl.principal(wallet3)],
        deployer
      );
      
      expect(result).toBeBool(false);
    });
  });
});





