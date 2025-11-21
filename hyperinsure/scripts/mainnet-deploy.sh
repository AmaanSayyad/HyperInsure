#!/bin/bash

# HyperInsure Mainnet Deployment Script
# This script deploys the insurance claim verification system to Stacks mainnet
# 
# ⚠️  WARNING: This deploys to MAINNET with real STX tokens!
# Make sure you have thoroughly tested on testnet first.

set -e  # Exit on any error

echo "🚨 MAINNET DEPLOYMENT WARNING 🚨"
echo "================================="
echo "This script will deploy to Stacks MAINNET using real STX tokens."
echo "Make sure you have:"
echo "1. ✅ Thoroughly tested on testnet"
echo "2. ✅ Completed security audit"
echo "3. ✅ Verified all contract code"
echo "4. ✅ Prepared secure wallet/keys"
echo "5. ✅ Sufficient STX for deployment fees"
echo ""

# Check if we're in the right directory
if [ ! -f "Clarinet.toml" ]; then
    echo "❌ Error: Clarinet.toml not found. Please run this script from the hyperinsure directory."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm to continue."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Parse command line arguments
DRY_RUN=false
CORE_ONLY=false
SKIP_VALIDATION=false
FORCE=false
CONFIRMED=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --core-only)
            CORE_ONLY=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --i-understand-this-is-mainnet)
            CONFIRMED=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "⚠️  WARNING: This deploys to MAINNET with real STX tokens!"
            echo ""
            echo "Options:"
            echo "  --dry-run                        Simulate deployment without executing"
            echo "  --core-only                      Deploy only core insurance contracts"
            echo "  --skip-validation                Skip tests and validation checks (NOT RECOMMENDED)"
            echo "  --force                          Continue deployment even if tests fail (NOT RECOMMENDED)"
            echo "  --i-understand-this-is-mainnet   Required flag to confirm mainnet deployment"
            echo "  --help, -h                       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --dry-run"
            echo "  $0 --i-understand-this-is-mainnet"
            echo "  $0 --core-only --i-understand-this-is-mainnet"
            echo ""
            echo "Security Checklist:"
            echo "  □ Tested thoroughly on testnet"
            echo "  □ Completed security audit"
            echo "  □ All tests passing"
            echo "  □ Secure wallet setup"
            echo "  □ Sufficient STX for fees"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

# Require confirmation flag for mainnet (unless dry-run)
if [ "$DRY_RUN" = false ] && [ "$CONFIRMED" = false ]; then
    echo "❌ Error: Mainnet deployment requires the --i-understand-this-is-mainnet flag"
    echo "This is a safety measure to prevent accidental mainnet deployments."
    echo ""
    echo "Use: $0 --i-understand-this-is-mainnet"
    echo "Or run with --dry-run to simulate the deployment first."
    exit 1
fi

# Check for testnet deployment record
TESTNET_RECORD="deployments/testnet-latest.json"
if [ ! -f "$TESTNET_RECORD" ] && [ "$DRY_RUN" = false ]; then
    echo "⚠️  Warning: No testnet deployment record found at $TESTNET_RECORD"
    echo "It's highly recommended to deploy and test on testnet first."
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled. Please test on testnet first."
        exit 1
    fi
fi

# Build deployment command
DEPLOY_CMD="node scripts/deploy.js mainnet"

if [ "$DRY_RUN" = true ]; then
    DEPLOY_CMD="$DEPLOY_CMD --dry-run"
    echo "🔍 Running in dry-run mode (no actual deployment)"
fi

if [ "$CORE_ONLY" = true ]; then
    DEPLOY_CMD="$DEPLOY_CMD --core-only"
    echo "📋 Deploying core contracts only"
fi

if [ "$SKIP_VALIDATION" = true ]; then
    DEPLOY_CMD="$DEPLOY_CMD --skip-validation"
    echo "⚠️  Skipping validation checks (NOT RECOMMENDED for mainnet)"
fi

if [ "$FORCE" = true ]; then
    DEPLOY_CMD="$DEPLOY_CMD --force"
    echo "⚠️  Force mode enabled (NOT RECOMMENDED for mainnet)"
fi

echo ""
echo "🎯 Target Network: Stacks MAINNET"
echo "💰 Network: REAL STX TOKENS WILL BE USED"
echo "📝 Command: $DEPLOY_CMD"
echo ""

# Final confirmation (unless dry-run)
if [ "$DRY_RUN" = false ]; then
    echo "🚨 FINAL CONFIRMATION 🚨"
    echo "========================"
    echo "You are about to deploy to MAINNET with real STX tokens."
    echo "Deployment fees will be charged to your account."
    echo ""
    echo "Pre-deployment checklist:"
    echo "□ All tests are passing"
    echo "□ Security audit completed"
    echo "□ Testnet deployment successful"
    echo "□ Wallet is properly configured"
    echo "□ Sufficient STX for deployment fees"
    echo ""
    
    read -p "Type 'DEPLOY TO MAINNET' to confirm: " -r
    echo
    if [[ $REPLY != "DEPLOY TO MAINNET" ]]; then
        echo "❌ Deployment cancelled. Confirmation text did not match."
        exit 1
    fi
    
    echo "⏳ Starting mainnet deployment in 5 seconds..."
    echo "Press Ctrl+C to cancel..."
    sleep 5
fi

# Run the deployment
echo "🚀 Starting mainnet deployment..."
echo ""

if eval $DEPLOY_CMD; then
    echo ""
    echo "✅ MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
    echo ""
    
    # Run verification unless it's a dry run
    if [ "$DRY_RUN" = false ]; then
        echo "🔍 Running deployment verification..."
        if node scripts/verify-deployment.js mainnet; then
            echo "✅ Deployment verification passed!"
        else
            echo "⚠️  Deployment verification had issues. Please check the output above."
        fi
    fi
    
    echo ""
    echo "🌐 Mainnet Explorer: https://explorer.hiro.so"
    echo "📊 API Endpoint: https://api.hiro.so"
    echo ""
    echo "🎉 Congratulations! Your insurance system is now live on mainnet!"
    echo ""
    echo "Next steps:"
    echo "1. 🔍 Monitor the contracts for any issues"
    echo "2. 💰 Fund the insurance treasury"
    echo "3. 🚀 Launch the frontend application"
    echo "4. 📢 Announce the launch to users"
    echo "5. 📊 Set up monitoring and alerts"
    echo ""
    echo "⚠️  Important: Keep monitoring the system closely after launch!"
    echo ""
else
    echo ""
    echo "❌ MAINNET DEPLOYMENT FAILED!"
    echo "Please check the error messages above."
    echo "Do not retry without understanding and fixing the issue."
    exit 1
fi