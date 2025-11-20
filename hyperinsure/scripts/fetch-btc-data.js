// Script to fetch real Bitcoin data for testing
// Usage: node scripts/fetch-btc-data.js <txid>

import mempoolJS from "@mempool/mempool.js";
import { Transaction } from "bitcoinjs-lib";

const {
  bitcoin: { transactions, blocks }
} = mempoolJS({
  hostname: "mempool.space"
});

const removeWitnessData = (txHex) => {
  const tx = Transaction.fromHex(txHex);

  if (!tx.hasWitnesses()) {
    return txHex;
  }

  const newTx = new Transaction();
  newTx.version = tx.version;

  tx.ins.forEach(input => {
    newTx.addInput(input.hash, input.index, input.sequence, input.script);
  });

  tx.outs.forEach(output => {
    newTx.addOutput(output.script, output.value);
  });

  newTx.locktime = tx.locktime;

  return newTx.toHex();
};

const fetchBitcoinData = async (txid) => {
  console.log(`\nFetching Bitcoin data for txid: ${txid}\n`);

  // Fetch transaction hex
  const fullTxHex = await transactions.getTxHex({ txid });
  const txHex = removeWitnessData(fullTxHex);
  
  console.log(`✅ Transaction hex fetched (${txHex.length / 2} bytes)`);
  console.log(`   Non-witness: ${txHex.length / 2} bytes`);

  // Fetch merkle proof
  const { block_height, merkle, pos } = await transactions.getTxMerkleProof({ txid });
  
  console.log(`✅ Merkle proof fetched`);
  console.log(`   Block height: ${block_height}`);
  console.log(`   Position: ${pos}`);
  console.log(`   Merkle hashes: ${merkle.length}`);

  // Fetch block header
  const blockHash = await blocks.getBlockHeight({ height: block_height });
  const blockHeader = await blocks.getBlockHeader({ hash: blockHash });
  
  console.log(`✅ Block header fetched (${blockHeader.length / 2} bytes)`);
  console.log(`   Block hash: ${blockHash}`);

  // Output TypeScript const
  console.log(`\n// Copy this into your test file:\n`);
  console.log(`const REAL_BTC_DATA = {`);
  console.log(`  txid: "${txid}",`);
  console.log(`  blockHeight: ${block_height},`);
  console.log(`  broadcastHeight: ${block_height - 40}, // Adjust as needed`);
  console.log(`  `);
  console.log(`  // Non-witness transaction hex`);
  console.log(`  txHex: "${txHex}",`);
  console.log(`  `);
  console.log(`  // 80-byte block header`);
  console.log(`  blockHeader: "${blockHeader}",`);
  console.log(`  `);
  console.log(`  // Merkle proof`);
  console.log(`  merkleProof: {`);
  console.log(`    txIndex: ${pos},`);
  console.log(`    hashes: [`);
  merkle.forEach((hash, i) => {
    console.log(`      "${hash}"${i < merkle.length - 1 ? ',' : ''}`);
  });
  console.log(`    ],`);
  console.log(`    treeDepth: ${merkle.length}`);
  console.log(`  }`);
  console.log(`};`);
};

const txid = process.argv[2] || "7ad7414063ab0f7ce7d5b1b6b4a87091094bd0e9be0e6a44925a48e1eb2ca51c";
fetchBitcoinData(txid).catch(console.error);
