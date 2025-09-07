# HyperInsure Smart Contracts

This directory contains the Clarity smart contracts that power the HyperInsure protocol, providing on-chain insurance for transaction delays, mempool congestion, and finality risks.

## Contract Architecture

HyperInsure is built using a streamlined contract architecture with just three core contracts:

### 1. Core Contract (`hyperinsure-core.clar`)

The main contract that handles policies, purchases, claims, and treasury management. This consolidated contract provides most of the protocol's functionality.

Key functions:
- **Policy Management**
  - `create-policy`: Creates a new insurance policy with specified parameters
  - `purchase-policy`: Allows users to purchase coverage
  - `update-policy-status`: Activates or deactivates policies

- **Claims Processing**
  - `submit-claim`: Allows users to submit claims for delayed transactions
  - `process-claim`: Processes claims (approve/reject)
  - `pay-claim`: Processes payouts for approved claims

- **Treasury Management**
  - `deposit`: Allows users to deposit STX into the treasury
  - `get-available-funds`: Returns the amount of funds available for payouts
  - `withdraw-excess`: Allows admin to withdraw excess funds

### 2. Oracle Contract (`oracle.clar`)

Manages transaction delay attestations from trusted oracles.

Key functions:
- `register-oracle`: Registers a new oracle
- `submit-attestation`: Allows oracles to submit transaction delay attestations
- `get-attestation`: Retrieves attestation data for a transaction

### 3. Governance Contract (`governance.clar`)

Manages protocol parameters and governance.

Key functions:
- `set-parameter`: Updates protocol parameters
- `create-proposal`: Creates a new governance proposal
- `vote`: Allows voting on proposals
- `execute-proposal`: Executes approved proposals

## How It Works

1. **Policy Creation**: Admins create insurance policies with specific parameters (delay threshold, premium percentage, protocol fee, payout amount).

2. **Coverage Purchase**: Users purchase coverage by paying a premium based on the STX amount they want to insure.

3. **Transaction Monitoring**: When a user submits a transaction, the RPC proxy records the broadcast height.

4. **Attestation**: Once the transaction is included in a block, an oracle signs an attestation of the broadcast → inclusion delay.

5. **Claim Submission**: If a transaction is delayed beyond the threshold, the user submits a claim with the transaction hash.

6. **Verification & Payout**: The protocol verifies the delay using oracle attestations and processes the payout if the claim is valid.

## Benefits of This Architecture

1. **Gas Efficiency**: Fewer contracts mean lower deployment and execution costs

2. **Simplified Integration**: Frontend components can interact with fewer contracts

3. **Reduced Complexity**: Fewer cross-contract calls reduce potential points of failure

4. **Easier Maintenance**: Consolidated functionality makes updates and bug fixes simpler

5. **Better Security**: Smaller attack surface with fewer contracts to audit

## Error Codes

Each contract uses standardized error codes:
- `ERR_UNAUTHORIZED`: Caller is not authorized to perform the operation
- `ERR_INSUFFICIENT_FUNDS`: Not enough funds available
- `ERR_INVALID_PARAMETER`: Invalid parameter provided
- And more specific error codes for each contract

## Security Considerations

- The contracts implement proper access controls with admin roles
- Treasury funds are protected by reserve ratios and withdrawal limits
- Oracle attestations require cryptographic signatures
- Governance proposals require sufficient votes and approval percentages

## Integration with Frontend

The frontend interacts with these contracts through the following components:
1. The Policy page displays available policies from the core contract
2. The Purchase page allows users to buy coverage through the core contract
3. The Claim page submits claims through the core contract
4. The Admin page creates policies and manages protocol parameters

## Development and Deployment

These contracts are designed to be deployed on the Stacks blockchain, which is anchored to Bitcoin for security. The contracts use Clarity, a decidable language that provides strong security guarantees and predictable execution.