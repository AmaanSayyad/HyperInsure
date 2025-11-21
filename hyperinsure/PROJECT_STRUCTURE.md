# Insurance Claim Verification System - Project Structure

## Overview
This document describes the project structure set up for the insurance claim verification system as specified in the design document.

## Directory Structure

```
hyperinsure/
├── contracts/                          # Clarity smart contracts
│   ├── insurance-treasury-v2.clar      # Treasury contract for fund management
│   ├── policy-manager.clar             # Policy creation and management
│   ├── claim-processor.clar            # Claim submission and verification
│   ├── clarity-bitcoin.clar            # Bitcoin verification library
│   ├── oracle.clar                     # Oracle contract (existing)
│   ├── governance.clar                 # Governance contract (existing)
│   └── hyperinsure-core-v2.clar          # Core contracts (existing)
├── tests/                              # Test files
│   ├── insurance-treasury-v2.test.ts   # Treasury contract tests
│   ├── policy-manager.test.ts          # Policy manager tests
│   ├── claim-processor.test.ts         # Claim processor tests
│   ├── property-test-setup.test.ts     # Property-based testing setup
│   └── *.test.ts                       # Other existing tests
├── utils/                              # Utility functions
│   ├── bitcoin-data.ts                 # Bitcoin data handling
│   └── bitcoin-verification.ts         # Verification utilities
├── Clarinet.toml                       # Clarinet configuration
├── package.json                        # Dependencies and scripts
├── vitest.config.js                    # Testing configuration
└── PROJECT_STRUCTURE.md                # This file
```

## New Contracts Created

### 1. Insurance Treasury v2 (`insurance-treasury-v2.clar`)
- Manages insurance fund deposits and payouts
- Tracks authorized funders and balances
- Implements treasury balance consistency
- Provides read-only functions for balance queries

### 2. Policy Manager (`policy-manager.clar`)
- Handles insurance policy creation and management
- Validates policy parameters and premium payments
- Tracks policy status and expiration
- Emits policy creation events

### 3. Claim Processor (`claim-processor.clar`)
- Manages claim submissions with Bitcoin evidence
- Validates merkle proofs and transaction data
- Prevents duplicate claims per policy
- Integrates with Bitcoin verification (placeholder for now)

## Dependencies Added

### Property-Based Testing
- **fast-check**: JavaScript property-based testing library
- Configured to run minimum 100 iterations per property
- Integrated with existing Vitest testing framework

### Existing Dependencies
- **@hirosystems/clarinet-sdk**: Clarity development and testing
- **vitest**: Testing framework with Clarinet integration
- **@stacks/transactions**: Stacks blockchain interactions
- **bitcoinjs-lib**: Bitcoin transaction handling

## Testing Framework

### Unit Tests
- Individual contract function testing
- Error condition validation
- Event emission verification
- Integration with Clarinet simnet

### Property-Based Tests
- Universal property verification across many inputs
- Configured with fast-check library
- Minimum 100 iterations per property test
- Tagged with requirement references

## Configuration Files

### Clarinet.toml
- Contract definitions and dependencies
- Clarity version 3, epoch 3.2
- Remote data enabled for mainnet integration

### package.json
- Updated with fast-check dependency
- Test scripts for unit and property testing
- Existing fuzz testing scripts maintained

### vitest.config.js
- Clarinet environment integration
- Single-threaded execution for deterministic testing
- Coverage and cost reporting enabled

## Next Steps

1. **Contract Integration**: Wire contracts together for cross-contract calls
2. **Bitcoin Verification**: Replace simulation with actual clarity-bitcoin-lib-v5 integration
3. **Property Tests**: Implement the 12 correctness properties from the design document
4. **Mainnet Testing**: Deploy and test with real Bitcoin data

## Notes

- New contracts follow the three-contract architecture from the design document
- All contracts include comprehensive error handling with defined error codes
- Event emission is implemented for all state-changing operations
- Property-based testing framework is ready for implementing correctness properties
- Line ending issues with new contracts need to be resolved before adding to Clarinet.toml