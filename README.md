# ⚡ HyperInsure

The first on-chain insurance protocol protecting blockchain users from transaction latency, mempool congestion, and finality delays, powered by Stacks + Bitcoin security.

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Powered by Stacks](https://img.shields.io/badge/Powered%20by-Stacks-black?style=for-the-badge&logo=stacks)](https://www.stacks.co/)
[![Secured by Bitcoin](https://img.shields.io/badge/Secured%20by-Bitcoin-orange?style=for-the-badge&logo=bitcoin)](https://bitcoin.org/)

## Overview

HyperInsure provides non-intrusive, verifiable insurance coverage for risks associated with transaction delays. Instead of paying high "tips" on top of base fees, users can purchase affordable insurance policies that provide protection against various types of transaction delays.

## Key Features

- **Transaction Delay Protection**: Coverage for transactions stuck in mempools
- **Mempool Congestion Insurance**: Protection during high network activity periods
- **Finality Risk Coverage**: Insurance against finality delays across congested networks
- **Non-Intrusive Implementation**: No additional parameters or code modifications needed
- **Verifiable Claims Process**: Transparent, on-chain verification of delays

## How It Works

1. **Purchase Coverage**: Users purchase coverage by paying STX tokens
2. **RPC Proxy API**: Our system records broadcast height at transaction submission
3. **Oracle Attestation**: Once included, an oracle signs an attestation of broadcast → inclusion delay
4. **Smart Contract Verification**: Clarity smart contracts verify proofs and release payouts if delay ≥ threshold

## Smart Contract Architecture EVM vs Stacks

### Interaction Diagrams

#### 1. EVM Tech Architecture vs Stacks Insurance Policy Purchase Flow

```mermaid
sequenceDiagram
    participant Admin
    participant User
    participant UI
    participant Insurance Contract
    participant RPC Proxy

    Note over Admin, Insurance Contract: Policy Creation (Admin Only)
    Admin->>Insurance Contract: createPolicy(parameters, thresholds)
    Insurance Contract->>Insurance Contract: Store policy configuration
    Insurance Contract-->>Admin: Policy ID created

    Note over User, RPC Proxy: User Purchases Share
    User->>UI: View available policies
    UI->>Insurance Contract: getPolicies() / getPolicyDetails(policyId)
    Insurance Contract-->>UI: Available policies and terms
    UI-->>User: Display policy options
    User->>UI: Select policy and ETH amount
    UI->>Insurance Contract: getShareQuote(policyId, ethAmount)
    Insurance Contract-->>UI: Coverage details (incidents covered)
    UI-->>User: Display coverage quote
    User->>UI: Purchase policy share
    UI->>Insurance Contract: purchaseShare(policyId) + ETH deposit
    Insurance Contract->>Insurance Contract: Record ETH amount for caller address
    Insurance Contract->>Insurance Contract: Calculate incidents covered
    Insurance Contract-->>UI: Share purchase confirmation
    UI-->>User: Coverage confirmation with incident count
```

#### 2. EVM Tech Architecture vs Stacks Txn Broadcasting with Delay Tracking 

```mermaid
sequenceDiagram
    participant User
    participant RPC Proxy
    participant Blockchain Network RPC
    participant Insurance Contract

    User->>RPC Proxy: Submit transaction
    RPC Proxy->>Blockchain Network RPC: getBlockNumber()
    Blockchain Network RPC-->>RPC Proxy: Current block number
    RPC Proxy->>RPC Proxy: Record submission block number
    RPC Proxy->>Blockchain Network RPC: Broadcast transaction
    RPC Proxy->>RPC Proxy: Sign submission proof
    RPC Proxy-->>User: Transaction submitted response
    
    alt Transaction executed within policy threshold
        Blockchain Network RPC-->>RPC Proxy: Transaction confirmed
        RPC Proxy->>RPC Proxy: Record execution block number
        RPC Proxy->>RPC Proxy: Calculate delay (execution - submission blocks)
        Note over RPC Proxy: Delay <= policy threshold (e.g., 10 blocks)
        RPC Proxy-->>User: Success response (no insurance claim)
    else Transaction delayed beyond threshold
        Note over Blockchain Network RPC: Transaction pending/quarantined
        Blockchain Network RPC-->>RPC Proxy: Transaction confirmed (late)
        RPC Proxy->>RPC Proxy: Record execution block number
        RPC Proxy->>RPC Proxy: Calculate delay (execution - submission blocks)
        Note over RPC Proxy: Delay > policy threshold (e.g., >10 blocks)
        RPC Proxy->>RPC Proxy: Generate delay evidence proof
        RPC Proxy-->>User: Delayed execution response + delay proof
    else Transaction failed after delay
        Note over Blockchain Network RPC: Transaction quarantined/failed
        RPC Proxy->>RPC Proxy: Record failure
        Note over RPC Proxy: No insurance payout for failed transactions
        RPC Proxy-->>User: Transaction failed response
    end
```

#### 3. EVM Tech Architecture vs Stacks Insurance Claim Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant RPC Proxy
    participant Insurance Contract
    participant Blockchain Network RPC

    User->>RPC Proxy: Request claim for txHash
    RPC Proxy->>RPC Proxy: Lookup cached transaction data
    Note over RPC Proxy: Retrieve broadcast block & confirmation block
    RPC Proxy->>RPC Proxy: Calculate delay (confirmation - broadcast blocks)
    RPC Proxy->>RPC Proxy: Generate signed proof (txHash, broadcastBlock, confirmationBlock)
    RPC Proxy-->>User: Signed delay evidence
    
    User->>RPC Proxy: Submit claim to contract
    RPC Proxy->>Insurance Contract: submitClaim(policyId, txHash, signedProof)
    Insurance Contract->>Insurance Contract: Verify RPC Proxy signature
    Insurance Contract->>Insurance Contract: Validate delay against policy threshold
    Insurance Contract->>Blockchain Network RPC: Verify transaction exists and block data
    Blockchain Network RPC-->>Insurance Contract: Transaction confirmation
    
    alt Valid claim and delay > threshold
        Insurance Contract->>Insurance Contract: Calculate payout amount
        Insurance Contract->>Insurance Contract: Check user's incident coverage remaining
        Insurance Contract->>User: Transfer payout (ETH)
        Insurance Contract->>Insurance Contract: Decrement user's incident count
        Insurance Contract-->>RPC Proxy: Claim approved
    else Invalid claim or no coverage
        Insurance Contract-->>RPC Proxy: Claim rejected
    end
    
    RPC Proxy-->>User: Claim result
```

#### 4. Complete User Journey

```mermaid
graph TD
    A[User wants to send transaction] --> B[Purchase insurance policy]
    B --> C[Submit transaction via RPC Proxy]
    C --> D{Transaction executed on time?}
    D -->|Yes| E[Transaction successful, no claim needed]
    D -->|No| F[Transaction delayed/failed]
    F --> G[Submit insurance claim]
    G --> H[RPC Proxy provides delay proof]
    H --> I[Insurance contract verifies claim]
    I --> J{Valid claim?}
    J -->|Yes| K[Receive insurance payout]
    J -->|No| L[Claim rejected]
```

HyperInsure is built on a streamlined contract architecture with three core components:

1. **Core Contract**: Manages policies, purchases, claims, and treasury functions
2. **Oracle Contract**: Handles attestations for transaction delays
3. **Governance Contract**: Controls protocol parameters and upgrades

## Technology Stack

### Frontend
- Next.js 15.2.4
- React 19
- Tailwind CSS
- shadcn/ui components

### Blockchain
- Stacks blockchain
- Clarity smart contracts
- Bitcoin security through burn block heights
- Secp256k1-signed oracle attestations

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/AmaanSayyad/hyperinsure.git

# Navigate to the project directory
cd hyperinsure

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Usage

### Purchase Insurance
1. Navigate to the Purchase page
2. Select an insurance policy
3. Enter the amount of STX to insure
4. Complete the purchase
5. Submit transaction details for claims

6. Navigate to the Claim
7. Enter the wallet address for the claim to be transferred
3. Submit your claim
4. Receive instant verification and payout if eligible

## Future Roadmap

We plan to extend HyperInsure to cover additional blockchain risks:

- Wallet theft protection via Arkham
- Transaction failure coverage
- Gas-spike hedging
- Validator risk coverage
- Cross-chain finality protection

## Contact

For questions or support, please reach out to us at:
- PitchDeck: https://docs.google.com/presentation/d/1EkrUS-6aj6qx1YxMwxP_RauebVnhXj5RC8IYZp5XFBw/edit?usp=sharing 
- Twitter: [@HyperInsure](https://x.com/hyperinsure)
