# HyperInsure Test Suite - GitHub Links

## 📋 Overview

This document contains GitHub permalink references to all test files and related code in the HyperInsure project.

**Repository:** `https://github.com/AmaanSayyad/HyperInsure`  
**Branch:** `main`

---

## 🧪 1. Unit Test Cases

### TypeScript/Vitest Unit Tests

#### Core Contract Tests
**File:** `hyperinsure/tests/hyperinsure-core.test.ts`  
**Tests:** 15 tests covering policy management, purchases, treasury, and admin functions  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/tests/hyperinsure-core.test.ts`

**Key Test Coverage:**
- Policy creation and validation
- Policy purchases and premium calculation
- Treasury deposit tracking
- Admin access control
- Reserve ratio management

---

#### Oracle Contract Tests
**File:** `hyperinsure/tests/oracle.test.ts`  
**Tests:** 16 tests covering oracle registration, attestations, and multi-oracle coordination  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/tests/oracle.test.ts`

**Key Test Coverage:**
- Oracle registration and management
- Attestation submission and validation
- Oracle status updates (active/inactive)
- Duplicate attestation prevention
- Delay calculation verification

---

#### Governance Contract Tests
**File:** `hyperinsure/tests/governance.test.ts`  
**Tests:** 22 tests covering proposals, voting, and parameter management  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/tests/governance.test.ts`

**Key Test Coverage:**
- Protocol parameter management
- Proposal creation and lifecycle
- Voting mechanisms (for/against)
- Proposal execution and cancellation
- Admin governance functions

---

### Clarity Native Unit Tests

#### Core Contract Clarity Tests
**File:** `hyperinsure/contracts/hyperinsure-core.tests.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/hyperinsure-core.tests.clar`

**Fuzz Testing Functions:**
- `test-premium-calculation` - Property-based premium calculation
- `test-fee-calculation` - Property-based fee calculation
- `invariant-reserve-ratio-valid` - Reserve ratio invariant check

---

#### Oracle Contract Clarity Tests
**File:** `hyperinsure/contracts/oracle.tests.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/oracle.tests.clar`

**Fuzz Testing Functions:**
- `test-delay-calculation` - Property-based delay calculation
- `test-attestation-uniqueness` - Attestation uniqueness verification
- `invariant-oracle-count-valid` - Oracle count invariant

---

#### Governance Contract Clarity Tests
**File:** `hyperinsure/contracts/governance.tests.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/governance.tests.clar`

**Fuzz Testing Functions:**
- `test-vote-counting` - Property-based vote counting
- `test-proposal-lifecycle` - Proposal state transitions
- `invariant-vote-totals-valid` - Vote totals invariant

---

## 🔗 2. Integration Testing

### Comprehensive Integration Tests
**File:** `hyperinsure/tests/integration.test.ts`  
**Tests:** 13 integration tests covering end-to-end workflows  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/tests/integration.test.ts`

**Test Suites:**

#### Complete Insurance Workflow (2 tests)
- Full policy lifecycle: create → purchase → claim → payout
- Claim rejection for insufficient delay

#### Multi-Oracle Consensus (2 tests)
- Multiple oracle attestation tracking
- Inactive oracle prevention

#### Governance Integration (2 tests)
- Governance parameter updates
- Proposal lifecycle tracking

#### Treasury Management (2 tests)
- Deposit and payout tracking
- Reserve ratio maintenance

#### Cross-Contract Interactions (1 test)
- Oracle and core contract coordination

#### Edge Cases and Error Handling (3 tests)
- Duplicate purchase prevention
- Duplicate attestation prevention
- Expired policy handling

#### System State Consistency (1 test)
- Counter consistency across operations

---

### Bitcoin Transaction Verification Tests
**File:** `hyperinsure/tests/bitcoin-verification.test.ts`  
**Tests:** 4 tests (all passing)  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/tests/bitcoin-verification.test.ts`

**Key Test Coverage:**
- Oracle registration for Bitcoin verification
- Unverified attestation submission
- Delay calculation from Bitcoin blocks
- Bitcoin transaction verification workflow simulation

---

### Mainnet Bitcoin Transaction Tests
**File:** `hyperinsure/tests/mainnet-btc-claim.test.ts`  
**Tests:** 6 tests (all passing)  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/tests/mainnet-btc-claim.test.ts`

**Real Transaction Test Cases:**

#### Positive Case - Delayed Transaction (APPROVED)
```
TxID: 819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461
Broadcast Height: 924,233
Confirmation Height: 924,282
Delay: 49 blocks (exceeds 35 block threshold)
Result: ✅ CLAIM APPROVED & PAID (10 STX)
Tests: 
  - Full claim processing workflow
  - Delay calculation verification
  - Bitcoin transaction data simulation
```

#### Negative Case - Quick Transaction (REJECTED)
```
TxID: b8a7449f4a570f0f568a16aca5ba1344498a1e977ae0560df4d89b5449690100
Broadcast Height: 924,280
Confirmation Height: 924,285
Delay: 5 blocks (below 35 block threshold)
Result: ❌ CLAIM REJECTED
Tests:
  - Claim rejection for insufficient delay
  - Insufficient delay calculation verification
  - State integrity after rejected claim
```

---

## 🎲 3. Fuzz Testing

### Rendezvous Fuzz Testing Integration

All contracts include fuzz testing functions using Rendezvous framework:

#### Core Contract Fuzz Tests
**File:** `hyperinsure/contracts/hyperinsure-core.tests.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/hyperinsure-core.tests.clar`

**Property-Based Tests:**
- Premium calculation consistency across random inputs
- Fee calculation consistency across random inputs

**Invariants:**
- Reserve ratio must be between 0 and 10000 (100%)

---

#### Oracle Contract Fuzz Tests
**File:** `hyperinsure/contracts/oracle.tests.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/oracle.tests.clar`

**Property-Based Tests:**
- Delay calculation: `inclusion-height - broadcast-height = delay`
- Attestation uniqueness: no duplicate tx-hash allowed

**Invariants:**
- Oracle count must be non-negative
- Active oracle count ≤ total oracle count

---

#### Governance Contract Fuzz Tests
**File:** `hyperinsure/contracts/governance.tests.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/governance.tests.clar`

**Property-Based Tests:**
- Vote counting: votes-for + votes-against = total-votes
- Proposal state transitions are valid

**Invariants:**
- Proposal count must be non-negative
- Vote counts must be non-negative
- votes-for + votes-against ≤ total possible votes

---

## 🛠️ Supporting Files

### Bitcoin Data Utilities
**File:** `hyperinsure/utils/bitcoin-data.ts`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/utils/bitcoin-data.ts`

**Functions:**
- `getTxHex()` - Fetch transaction hex from mempool.space
- `getTxMerkleProof()` - Fetch Merkle proof
- `getBlockHeader()` - Fetch block header
- `getBlockHashByHeight()` - Fetch block hash by height
- `getBitcoinTxData()` - Complete transaction data fetcher

---

### Clarity Bitcoin Library
**File:** `hyperinsure/contracts/clarity-bitcoin.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/clarity-bitcoin.clar`

**Purpose:** Bitcoin transaction parsing and verification on Stacks blockchain

---

### Main Contracts

#### HyperInsure Core Contract
**File:** `hyperinsure/contracts/hyperinsure-core.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/hyperinsure-core.clar`

**Key Functions:**
- `create-policy` - Create insurance policy
- `purchase-policy` - Purchase insurance coverage
- `submit-claim` - Submit insurance claim
- `process-claim` - Process and pay claims
- `fund-contract` - Fund contract treasury

---

#### Oracle Contract
**File:** `hyperinsure/contracts/oracle.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/oracle.clar`

**Key Functions:**
- `register-oracle` - Register new oracle
- `submit-attestation` - Submit Bitcoin transaction attestation
- `update-oracle-status` - Activate/deactivate oracle
- `get-attestation` - Query attestation data

---

#### Governance Contract
**File:** `hyperinsure/contracts/governance.clar`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/contracts/governance.clar`

**Key Functions:**
- `create-proposal` - Create governance proposal
- `vote` - Vote on proposal
- `cancel-proposal` - Cancel proposal
- `set-parameter` - Update protocol parameters

---

## 📊 Test Results Summary

**File:** `TEST_RESULTS.md`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/TEST_RESULTS.md`

**Statistics:**
- Total Tests: 76
- Passed: 76 ✅
- Skipped: 0 ⏭️
- Failed: 0 ❌
- Success Rate: 100% 🎯

**All tests run successfully using simnet - no network dependencies!**

---

## 🚀 Running the Tests

### Run All Tests
```bash
cd hyperinsure
npm test
```

### Run Specific Test Suite
```bash
npm test -- unit-test-file.test.ts
```

### Run with Verbose Output
```bash
npm test -- --reporter=verbose
```

### Run Mainnet Bitcoin Tests
```bash
npm test -- mainnet-btc-claim.test.ts
```

---

## 📝 Configuration Files

### Clarinet Configuration
**File:** `hyperinsure/Clarinet.toml`  
**GitHub Link:** `https://github.com/AmaanSayyad/HyperInsure/blob/main/hyperinsure/Clarinet.toml`

**Contains:**
- Contract definitions
- Network configurations (testnet, mainnet)
- Account settings

---

## 🔍 Test Coverage Areas

### ✅ Functional Coverage
- [x] Policy management (create, update, deactivate)
- [x] Purchase flow (buy, validate, expire)
- [x] Claims processing (submit, approve, reject, pay)
- [x] Oracle operations (register, attest, manage)
- [x] Governance (propose, vote, execute)
- [x] Treasury management (deposit, withdraw, track)
- [x] Bitcoin transaction verification

### ✅ Error Handling Coverage
- [x] Unauthorized access attempts
- [x] Duplicate operations (purchases, attestations)
- [x] Invalid parameters
- [x] Insufficient funds
- [x] Expired policies
- [x] Inactive oracles
- [x] Below-threshold delays

### ✅ Integration Coverage
- [x] Multi-contract interactions
- [x] Cross-contract state consistency
- [x] Real Bitcoin mainnet transactions
- [x] End-to-end workflows

### ✅ Fuzz Testing Coverage
- [x] Property-based calculations
- [x] Invariant verification
- [x] Random input validation
- [x] State consistency checks

