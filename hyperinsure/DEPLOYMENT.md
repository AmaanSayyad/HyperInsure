# HyperInsure Deployment Guide

This guide covers deploying the HyperInsure insurance claim verification system to Stacks testnet and mainnet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Configuration](#configuration)
3. [Testnet Deployment](#testnet-deployment)
4. [Mainnet Deployment](#mainnet-deployment)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Clarinet** (latest version)
- **Stacks CLI** (optional, for advanced operations)

### Installation

```bash
# Install Node.js and npm (if not already installed)
# Visit https://nodejs.org/

# Install Clarinet
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-linux-x64.tar.gz | tar xz
sudo mv clarinet /usr/local/bin/

# Verify installations
node --version
npm --version
clarinet --version
```

### Project Setup

```bash
# Navigate to the hyperinsure directory
cd hyperinsure

# Install dependencies
npm install

# Run tests to ensure everything works
npm test
```

## Configuration

### Testnet Configuration

1. Edit `settings/Testnet.toml`
2. Add your testnet account mnemonics or configure wallet integration
3. Adjust deployment parameters as needed

```toml
[accounts.deployer]
mnemonic = "YOUR_TESTNET_MNEMONIC_HERE"
balance = 100_000_000_000_000
```

**Security Note**: Testnet mnemonics can be committed to version control, but use caution.

### Mainnet Configuration

1. Edit `settings/Mainnet.toml`
2. **NEVER** commit real mainnet mnemonics to version control
3. Use environment variables or hardware wallets

```bash
# Set environment variable for mainnet deployer
export MAINNET_DEPLOYER_MNEMONIC="your secure mnemonic here"
```

**Security Note**: For mainnet, always use:
- Hardware wallets (Ledger, Trezor)
- Encrypted key storage
- Multi-signature wallets for production
- Environment variables (never hardcoded)

## Testnet Deployment

### Quick Start

```bash
# Dry run (recommended first)
npm run deploy:testnet:dry-run

# Deploy core contracts only
npm run deploy:testnet:core

# Full deployment
npm run deploy:testnet
```

### Step-by-Step Deployment

#### 1. Pre-Deployment Checks

```bash
# Run all tests
npm test

# Check contract syntax
clarinet check

# Dry run deployment
./scripts/testnet-deploy.sh --dry-run
```

#### 2. Deploy to Testnet

```bash
# Interactive deployment with all checks
./scripts/testnet-deploy.sh

# Or use npm script
npm run deploy:testnet
```

The script will:
- ✅ Validate environment and dependencies
- ✅ Run contract syntax checks
- ✅ Execute test suite
- ✅ Deploy contracts in correct order
- ✅ Verify deployment
- ✅ Save deployment record

#### 3. Verify Deployment

```bash
# Run verification script
npm run verify:testnet

# Or manually
node scripts/verify-deployment.js testnet
```

#### 4. Test Deployed Contracts

After deployment, test the contracts:

```bash
# Run integration tests against testnet
npm run test:integration:testnet

# Test with real Bitcoin data
npm run test:bitcoin:testnet
```

### Testnet Deployment Options

```bash
# Deploy with options
./scripts/testnet-deploy.sh [options]

Options:
  --dry-run         Simulate deployment without executing
  --core-only       Deploy only core insurance contracts
  --skip-validation Skip tests and validation checks
  --force           Continue deployment even if tests fail
```

## Mainnet Deployment

### Pre-Mainnet Checklist

Before deploying to mainnet, ensure:

- [ ] ✅ All tests passing on testnet
- [ ] ✅ Security audit completed
- [ ] ✅ Integration tests successful
- [ ] ✅ Real Bitcoin verification tested
- [ ] ✅ Frontend tested with testnet contracts
- [ ] ✅ Wallet security configured (hardware wallet recommended)
- [ ] ✅ Sufficient STX for deployment fees (~50-100 STX)
- [ ] ✅ Backup and recovery plan in place
- [ ] ✅ Monitoring and alerting configured

### Mainnet Deployment Process

#### 1. Final Pre-Deployment Checks

```bash
# Run full test suite
npm test

# Run property-based tests
npm run test:property

# Verify contract syntax
clarinet check

# Dry run mainnet deployment
./scripts/mainnet-deploy.sh --dry-run
```

#### 2. Deploy to Mainnet

```bash
# Deploy to mainnet (requires confirmation)
./scripts/mainnet-deploy.sh --i-understand-this-is-mainnet

# Or use npm script
npm run deploy:mainnet
```

**⚠️ WARNING**: This uses real STX tokens and deploys to production!

The deployment script will:
1. Show security warnings
2. Verify testnet deployment exists
3. Run all validation checks
4. Require explicit confirmation
5. Deploy contracts in order
6. Verify deployment
7. Save deployment record

#### 3. Post-Deployment Verification

```bash
# Verify mainnet deployment
npm run verify:mainnet

# Check contract interfaces
node scripts/verify-deployment.js mainnet
```

#### 4. Initialize Contracts

After deployment, initialize the system:

```bash
# Fund the insurance treasury
# (Use Stacks wallet or CLI)

# Configure contract parameters
# (Set admin addresses, rate limits, etc.)

# Test with small amounts first
```

### Mainnet Deployment Options

```bash
./scripts/mainnet-deploy.sh [options]

Options:
  --dry-run                        Simulate deployment
  --core-only                      Deploy only core contracts
  --i-understand-this-is-mainnet   Required confirmation flag
```

## Verification

### Automated Verification

The deployment scripts automatically run verification checks:

```bash
# Verify testnet deployment
node scripts/verify-deployment.js testnet

# Verify mainnet deployment
node scripts/verify-deployment.js mainnet
```

### Manual Verification

#### Check Contract Deployment

```bash
# Using Stacks API
curl https://api.testnet.hiro.so/v2/contracts/interface/ST1234.insurance-treasury-v2

# Using Stacks Explorer
# Visit: https://explorer.hiro.so/?chain=testnet
```

#### Test Read-Only Functions

```bash
# Test treasury balance
clarinet console
>> (contract-call? .insurance-treasury-v2 get-treasury-balance)

# Test policy retrieval
>> (contract-call? .policy-manager get-policy u1)
```

#### Test Contract Interactions

```bash
# Run integration tests
npm run test:integration

# Test Bitcoin verification
npm run test:bitcoin
```

## Deployment Records

Deployment information is saved in `deployments/`:

```
deployments/
├── testnet-latest.json       # Latest testnet deployment
├── testnet-1234567890.json   # Timestamped testnet deployment
├── mainnet-latest.json       # Latest mainnet deployment
└── mainnet-1234567890.json   # Timestamped mainnet deployment
```

Each record contains:
- Contract addresses
- Deployment timestamp
- Network configuration
- Deployment log

## Troubleshooting

### Common Issues

#### 1. Insufficient Funds

**Error**: "Insufficient funds for deployment"

**Solution**:
```bash
# Check account balance
stx balance ST1234567890ABCDEF

# Get testnet STX from faucet
# Visit: https://explorer.hiro.so/sandbox/faucet?chain=testnet
```

#### 2. Contract Already Exists

**Error**: "Contract already deployed"

**Solution**:
- Use a different deployer address
- Or increment contract version number
- Or deploy to a different network

#### 3. Dependency Issues

**Error**: "Contract dependency not found"

**Solution**:
```bash
# Ensure contracts are deployed in order
# Check Clarinet.toml for dependency chain
clarinet check
```

#### 4. Test Failures

**Error**: "Tests failed during deployment"

**Solution**:
```bash
# Run tests individually to identify issue
npm test

# Fix failing tests
# Re-run deployment
```

### Getting Help

- **Documentation**: Check this guide and contract documentation
- **Logs**: Review deployment logs in `deployments/` directory
- **Community**: Ask in Stacks Discord or GitHub issues
- **Support**: Contact the development team

## Security Best Practices

### For Testnet

- Use separate test accounts
- Don't reuse testnet keys for mainnet
- Test all functionality thoroughly

### For Mainnet

- **NEVER** commit private keys or mnemonics
- Use hardware wallets for deployment
- Implement multi-signature for admin functions
- Set up monitoring and alerts
- Have a incident response plan
- Keep deployment keys in secure storage
- Use environment variables for sensitive data
- Audit all contracts before deployment
- Test extensively on testnet first
- Have a rollback plan

## Post-Deployment

### Monitoring

Set up monitoring for:
- Contract transactions
- Treasury balance
- Claim submissions
- Payout executions
- Error rates

### Maintenance

Regular tasks:
- Monitor contract health
- Review transaction logs
- Update documentation
- Respond to issues
- Plan upgrades

### Upgrades

For contract upgrades:
1. Deploy new contract version
2. Migrate data if needed
3. Update frontend to use new contracts
4. Deprecate old contracts gracefully

## Additional Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarinet Documentation](https://docs.hiro.so/clarinet)
- [Clarity Language Reference](https://docs.stacks.co/clarity)
- [HyperInsure Project Documentation](./PROJECT_STRUCTURE.md)

## Support

For deployment support:
- GitHub Issues: [Project Repository]
- Discord: [Stacks Discord]
- Email: [Support Email]
