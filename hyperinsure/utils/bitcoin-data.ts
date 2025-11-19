/**
 * Bitcoin Data Fetcher
 * Utilities to fetch real Bitcoin transaction data from mempool.space
 */

export interface BitcoinTxData {
  txHash: string;
  txHex: string;
  blockHeight: number;
  blockHash: string;
  blockHeader: string;
  merkleProof: {
    blockHeight: number;
    merkle: string[];
    pos: number;
  };
}

/**
 * Fetch Bitcoin transaction hex from mempool.space
 */
export async function getTxHex(txid: string): Promise<string> {
  const response = await fetch(`https://mempool.space/api/tx/${txid}/hex`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transaction: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Fetch Bitcoin transaction merkle proof
 */
export async function getTxMerkleProof(txid: string) {
  const response = await fetch(`https://mempool.space/api/tx/${txid}/merkle-proof`);
  if (!response.ok) {
    throw new Error(`Failed to fetch merkle proof: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch Bitcoin block header
 */
export async function getBlockHeader(blockHash: string): Promise<string> {
  const response = await fetch(`https://mempool.space/api/block/${blockHash}/header`);
  if (!response.ok) {
    throw new Error(`Failed to fetch block header: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Fetch block hash by height
 */
export async function getBlockHashByHeight(height: number): Promise<string> {
  const response = await fetch(`https://mempool.space/api/block-height/${height}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch block hash: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Fetch complete Bitcoin transaction data for testing
 */
export async function getBitcoinTxData(txid: string): Promise<BitcoinTxData> {
  const [txHex, merkleProof] = await Promise.all([
    getTxHex(txid),
    getTxMerkleProof(txid)
  ]);

  const blockHash = await getBlockHashByHeight(merkleProof.block_height);
  const blockHeader = await getBlockHeader(blockHash);

  return {
    txHash: txid,
    txHex,
    blockHeight: merkleProof.block_height,
    blockHash,
    blockHeader,
    merkleProof: {
      blockHeight: merkleProof.block_height,
      merkle: merkleProof.merkle,
      pos: merkleProof.pos
    }
  };
}

/**
 * Example usage:
 * 
 * const txData = await getBitcoinTxData("c1de234c01ecc47906117d012865ce3dabbbb081dc0309a74dbbae45e427aadc");
 * console.log("Transaction data:", txData);
 */
