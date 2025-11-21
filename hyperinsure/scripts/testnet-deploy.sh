#!/bin/bash

# HyperInsure Testnet Deployment Script
# This script deploys the insurance claim verification system to Stacks testnet

set -e  # Exit on any error

echo "🚀 Starting HyperInsure Testnet Deployment"
echo "=========================================="

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
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --dry-run         Simulate deployment without executing"
            echo "  --core-only       Deploy only core insurance contracts"
            echo "  --skip-validation Skip tests and validation checks"
            echo "  --force           Continue deployment even if tests fail"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --dry-run"
            echo "  $0 --core-only"
            echo "  $0 --skip-validation"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

# Build deployment command
DEPLOY_CMD="node scripts/deploy.js testnet"

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
    echo "⚠️  Skipping validation checks"
fi

if [ "$FORCE" = true ]; then
    DEPLOY_CMD="$DEPLOY_CMD --force"
    echo "⚠️  Force mode enabled"
fi

echo ""
echo "🎯 Target Network: Stacks Testnet"
echo "📝 Command: $DEPLOY_CMD"
echo ""

# Confirm deployment (unless dry-run)
if [ "$DRY_RUN" = false ]; then
    read -p "Are you sure you want to deploy to testnet? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Run the deployment
echo "🚀 Starting deployment..."
echo ""

if eval $DEPLOY_CMD; then
    echo ""
    echo "✅ Testnet deployment completed successfully!"
    echo ""
    
    # Run verification unless it's a dry run
    if [ "$DRY_RUN" = false ]; then
        echo "🔍 Running deployment verification..."
        if node scripts/verify-deployment.js testnet; then
            echo "✅ Deployment verification passed!"
        else
            echo "⚠️  Deployment verification had issues. Please check the output above."
        fi
    fi
    
    echo ""
    echo "🌐 Testnet Explorer: https://explorer.hiro.so/?chain=testnet"
    echo "📊 API Endpoint: https://api.testnet.hiro.so"
    echo ""
    echo "Next steps:"
    echo "1. Test the deployed contracts using the frontend"
    echo "2. Run integration tests with real Bitcoin data"
    echo "3. Prepare for mainnet deployment when ready"
    echo ""
else
    echo ""
    echo "❌ Testnet deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi