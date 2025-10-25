/**
 * Stacks Blockchain API utilities for HyperInsure
 * 
 * Functions to interact with the Stacks blockchain for verification of transaction delays
 */

/**
 * Fetches block information by height from the Stacks API
 * @param height The block height to fetch
 * @returns Block information including timestamps and hashes
 */
export async function getBlockByHeight(height: number) {
  try {
    const response = await fetch(`https://api.hiro.so/extended/v1/block/by_height/${height}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch block: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching block by height:', error);
    throw error;
  }
}

/**
 * Fetches recent blocks from the Stacks API
 * @param limit Number of blocks to fetch (default: 20)
 * @param offset Pagination offset (default: 0)
 * @returns List of recent blocks
 */
export async function getRecentBlocks(limit = 20, offset = 0) {
  try {
    const response = await fetch(
      `https://api.hiro.so/extended/v2/blocks/?limit=${limit}&offset=${offset}`, 
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recent blocks: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent blocks:', error);
    throw error;
  }
}

/**
 * Calculate the delay between transaction broadcast and inclusion
 * @param broadcastHeight The block height when transaction was broadcast
 * @param inclusionHeight The block height when transaction was included
 * @returns Number of blocks of delay
 */
export async function calculateBlockDelay(broadcastHeight: number, inclusionHeight: number): Promise<number> {
  if (inclusionHeight <= broadcastHeight) {
    return 0; // No delay if included in same or earlier block (shouldn't happen normally)
  }
  
  return inclusionHeight - broadcastHeight;
}

/**
 * Verifies if a transaction has sufficient delay to qualify for an insurance claim
 * @param txHash The transaction hash to verify
 * @param broadcastHeight The claimed broadcast height
 * @param inclusionHeight The actual inclusion height
 * @param requiredDelay The minimum delay required for a valid claim
 * @returns Object with verification result and delay information
 */
export async function verifyTransactionDelay(
  txHash: string,
  broadcastHeight: number,
  inclusionHeight: number,
  requiredDelay: number
) {
  try {
    // Get block information for both heights to verify timestamps
    const [broadcastBlock, inclusionBlock] = await Promise.all([
      getBlockByHeight(broadcastHeight),
      getBlockByHeight(inclusionHeight)
    ]);
    
    // Calculate delay in blocks
    const blockDelay = inclusionHeight - broadcastHeight;
    
    // Calculate delay in seconds using block timestamps
    const timeDelay = inclusionBlock.burn_block_time - broadcastBlock.burn_block_time;
    
    // Format timestamps for display
    const broadcastTime = new Date(broadcastBlock.burn_block_time_iso).toLocaleString();
    const inclusionTime = new Date(inclusionBlock.burn_block_time_iso).toLocaleString();
    
    // Check if delay meets the required threshold
    const isEligible = blockDelay >= requiredDelay;
    
    return {
      isEligible,
      blockDelay,
      timeDelay,
      broadcastTime,
      inclusionTime,
      broadcastHeight,
      inclusionHeight,
      txHash,
      broadcastBlockHash: broadcastBlock.hash,
      inclusionBlockHash: inclusionBlock.hash
    };
  } catch (error) {
    console.error('Error verifying transaction delay:', error);
    throw error;
  }
}

/**
 * Gets the current block height from the Stacks blockchain
 * @returns The current block height
 */
export async function getCurrentBlockHeight(): Promise<number> {
  try {
    const recentBlocks = await getRecentBlocks(1);
    if (recentBlocks.results && recentBlocks.results.length > 0) {
      return recentBlocks.results[0].height;
    }
    throw new Error('Could not determine current block height');
  } catch (error) {
    console.error('Error getting current block height:', error);
    throw error;
  }
}
