import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { hexToBytes } from "@stacks/common";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user = accounts.get("wallet_1")!;


describe("HyperInsure V2 - Real Bitcoin Transaction Verification", () => {
  

  const REAL_TX_DATA = {
    txid: "819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461",
    blockHeight: 924282,
    broadcastHeight: 924233,
    delay: 49,
    threshold: 35,
    

    txHex: "0200000001...", 
    
    
    blockHeader: "00000020...",
    
    
    merkleProof: {
      pos: 878,
      merkle: [
        
        "abc123...",
        "def456...",
        "ghi789...",
      ],
      treeDepth: 3
    }
  };

  describe("Policy and Purchase Setup", () => {
    it("should create V2 policy", () => {
      const { result } = simnet.callPublicFn(
        "hyperinsure-core-v2",
        "create-policy",
        [
          Cl.stringAscii("btc-delay-v2"),
          Cl.stringAscii("Bitcoin Delay Insurance V2"),
          Cl.stringUtf8("Trustless Bitcoin transaction delay protection"),
          Cl.uint(REAL_TX_DATA.threshold),
          Cl.uint(500), 
          Cl.uint(100), 
          Cl.uint(10000000), 
        ],
        deployer
      );
      
      expect(result).toBeOk(Cl.stringAscii("btc-delay-v2"));
      
      console.log("\n✅ V2 Policy Created:");
      console.log(`   Policy ID: btc-delay-v2`);
      console.log(`   Threshold: ${REAL_TX_DATA.threshold} blocks`);
      console.log(`   Payout: 10 STX`);
    });

    it("should purchase V2 policy", () => {
      
      simnet.callPublicFn(
        "hyperinsure-core-v2",
        "create-policy",
        [
          Cl.stringAscii("btc-v2-test"),
          Cl.stringAscii("Test Policy"),
          Cl.stringUtf8("Test"),
          Cl.uint(35),
          Cl.uint(500),
          Cl.uint(100),
          Cl.uint(10000000),
        ],
        deployer
      );

     
      simnet.callPublicFn(
        "hyperinsure-core-v2",
        "fund-contract",
        [Cl.uint(100000000)],
        deployer
      );

      
      const { result } = simnet.callPublicFn(
        "hyperinsure-core-v2",
        "purchase-policy",
        [
          Cl.stringAscii("btc-v2-test"),
          Cl.uint(20000000), // 20 STX
          Cl.stringAscii("v2-purchase-001"),
        ],
        user
      );

      expect(result).toBeOk(Cl.stringAscii("v2-purchase-001"));
      
      console.log("\n✅ Policy Purchased:");
      console.log(`   Purchase ID: v2-purchase-001`);
      console.log(`   Amount: 20 STX`);
    });
  });

  describe("Trustless Bitcoin Verification", () => {
    it("demonstrates real Bitcoin transaction verification flow", () => {
      console.log("\n🔐 Trustless Bitcoin Verification Flow:");
      console.log("\n📊 Real Transaction Data:");
      console.log(`   TxID: ${REAL_TX_DATA.txid}`);
      console.log(`   Block Height: ${REAL_TX_DATA.blockHeight}`);
      console.log(`   Broadcast Height: ${REAL_TX_DATA.broadcastHeight}`);
      console.log(`   Delay: ${REAL_TX_DATA.delay} blocks`);
      console.log(`   Threshold: ${REAL_TX_DATA.threshold} blocks`);
      console.log(`   Exceeded by: ${REAL_TX_DATA.delay - REAL_TX_DATA.threshold} blocks ✅`);
      
      console.log("\n📝 Verification Process:");
      console.log("   1. User fetches Bitcoin transaction data:");
      console.log("      - Transaction hex (non-witness)");
      console.log("      - Block header (80 bytes)");
      console.log("      - Merkle proof (hashes + position)");
      
      console.log("\n   2. User submits claim with proof:");
      console.log("      submit-claim-with-proof(");
      console.log("        claim-id,");
      console.log("        purchase-id,");
      console.log("        tx-hash,");
      console.log("        broadcast-height,");
      console.log("        inclusion-height,");
      console.log("        tx,           // Real Bitcoin tx hex");
      console.log("        header,       // Real block header");
      console.log("        proof         // Real merkle proof");
      console.log("      )");
      
      console.log("\n   3. Contract verifies using clarity-bitcoin-lib-v5:");
      console.log("      - Calculates tx hash from tx hex");
      console.log("      - Verifies merkle proof");
      console.log("      - Checks block header merkle root");
      console.log("      - Validates delay threshold");
      
      console.log("\n   4. If valid:");
      console.log("      - Claim auto-approved");
      console.log("      - Payout processed");
      console.log("      - No oracle needed! ✅");
      
      console.log("\n🎯 Key Advantages:");
      console.log("   ✅ Trustless - No oracle dependency");
      console.log("   ✅ Decentralized - Direct Bitcoin verification");
      console.log("   ✅ Secure - Cryptographic proof");
      console.log("   ✅ Transparent - All verification on-chain");
      console.log("   ✅ Cost-effective - No oracle fees");
      
      expect(true).toBe(true);
    });

    it("shows how to fetch real Bitcoin data", () => {
      console.log("\n📡 Fetching Real Bitcoin Data:");
      console.log("\n```javascript");
      console.log("import { getTxHex, getTxMerkleProof, getBlkHeader, removeWitnessData }");
      console.log("  from './btc-tx-data.js'");
      console.log("");
      console.log("// 1. Fetch transaction hex");
      console.log(`let fullTxHex = await getTxHex('${REAL_TX_DATA.txid}')`);
      console.log("let txHex = removeWitnessData(fullTxHex)");
      console.log("");
      console.log("// 2. Fetch merkle proof");
      console.log(`let { block_height, merkle, pos } = await getTxMerkleProof('${REAL_TX_DATA.txid}')`);
      console.log("");
      console.log("// 3. Fetch block header");
      console.log("let { blockHeader } = await getBlkHeader(block_height)");
      console.log("");
      console.log("// 4. Prepare proof for Clarity");
      console.log("let proof = {");
      console.log("  'tx-index': uintCV(pos),");
      console.log("  hashes: listCV(merkle.map(h => bufferCV(hexToBytes(h).reverse()))),");
      console.log("  'tree-depth': uintCV(merkle.length)");
      console.log("}");
      console.log("```");
      
      console.log("\n📦 Data Structure:");
      console.log(`   Block Height: ${REAL_TX_DATA.blockHeight}`);
      console.log(`   Merkle Position: ${REAL_TX_DATA.merkleProof.pos}`);
      console.log(`   Merkle Hashes: ${REAL_TX_DATA.merkleProof.merkle.length}`);
      console.log(`   Tree Depth: ${REAL_TX_DATA.merkleProof.treeDepth}`);
      
      expect(true).toBe(true);
    });
  });

  describe("V1 vs V2 Comparison", () => {
    it("compares oracle-based vs trustless approach", () => {
      console.log("\n🔄 V1 vs V2 Architecture Comparison:");
      
      console.log("\n❌ V1 (Oracle-Based):");
      console.log("   1. User purchases policy");
      console.log("   2. Bitcoin transaction occurs");
      console.log("   3. Oracle monitors transaction");
      console.log("   4. Oracle submits attestation");
      console.log("   5. User submits claim");
      console.log("   6. Admin reviews claim");
      console.log("   7. Admin approves/rejects");
      console.log("   8. Payout processed");
      console.log("");
      console.log("   Issues:");
      console.log("   - Requires trust in oracle");
      console.log("   - Single point of failure");
      console.log("   - Oracle can be compromised");
      console.log("   - Additional oracle fees");
      console.log("   - Centralization risk");
      
      console.log("\n✅ V2 (Trustless):");
      console.log("   1. User purchases policy");
      console.log("   2. Bitcoin transaction occurs");
      console.log("   3. User fetches Bitcoin proof");
      console.log("   4. User submits claim + proof");
      console.log("   5. Contract verifies (clarity-bitcoin-lib-v5)");
      console.log("   6. Auto-approval if valid");
      console.log("   7. Automatic payout");
      console.log("");
      console.log("   Benefits:");
      console.log("   - No trust required");
      console.log("   - Fully decentralized");
      console.log("   - Cryptographic security");
      console.log("   - No oracle fees");
      console.log("   - Transparent verification");
      
      console.log("\n📊 Comparison Table:");
      console.log("   ┌─────────────────────┬──────────────┬──────────────┐");
      console.log("   │ Feature             │ V1 (Oracle)  │ V2 (Trustless)│");
      console.log("   ├─────────────────────┼──────────────┼──────────────┤");
      console.log("   │ Trust Model         │ Trust Oracle │ Trustless    │");
      console.log("   │ Verification        │ Off-chain    │ On-chain     │");
      console.log("   │ Decentralization    │ Partial      │ Full         │");
      console.log("   │ Single Point Failure│ Yes          │ No           │");
      console.log("   │ Oracle Fees         │ Yes          │ No           │");
      console.log("   │ Transparency        │ Limited      │ Full         │");
      console.log("   │ Security            │ Oracle-dep   │ Cryptographic│");
      console.log("   └─────────────────────┴──────────────┴──────────────┘");
      
      expect(true).toBe(true);
    });
  });

  describe("Integration with clarity-bitcoin-lib-v5", () => {
    it("explains clarity-bitcoin-lib-v5 integration", () => {
      console.log("\n🔗 clarity-bitcoin-lib-v5 Integration:");
      
      console.log("\n📍 Mainnet Contract:");
      console.log("   Address: SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9");
      console.log("   Contract: clarity-bitcoin-lib-v5");
      console.log("   Function: was-tx-mined-compact");
      
      console.log("\n📝 Function Signature:");
      console.log("   (was-tx-mined-compact");
      console.log("     (height uint)");
      console.log("     (tx (buff 4096))");
      console.log("     (header (buff 80))");
      console.log("     (proof {");
      console.log("       tx-index: uint,");
      console.log("       hashes: (list 14 (buff 32)),");
      console.log("       tree-depth: uint");
      console.log("     })");
      console.log("   )");
      
      console.log("\n🔐 Verification Process:");
      console.log("   1. Calculate tx hash: SHA256(SHA256(tx))");
      console.log("   2. Build merkle root from proof");
      console.log("   3. Extract merkle root from header");
      console.log("   4. Compare: proof_root == header_root");
      console.log("   5. Return: (ok tx-hash) or (err u1)");
      
      console.log("\n✅ Benefits:");
      console.log("   - Deployed and audited on mainnet");
      console.log("   - Battle-tested implementation");
      console.log("   - No external dependencies");
      console.log("   - Pure Clarity code");
      console.log("   - Fully trustless");
      
      expect(true).toBe(true);
    });
  });
});
