@echo off
REM HyperInsure Mainnet Deployment Script for Windows
REM This script deploys the insurance claim verification system to Stacks mainnet
REM 
REM ⚠️  WARNING: This deploys to MAINNET with real STX tokens!
REM Make sure you have thoroughly tested on testnet first.

echo 🚨 MAINNET DEPLOYMENT WARNING 🚨
echo =================================
echo This script will deploy to Stacks MAINNET using real STX tokens.
echo Make sure you have:
echo 1. ✅ Thoroughly tested on testnet
echo 2. ✅ Completed security audit
echo 3. ✅ Verified all contract code
echo 4. ✅ Prepared secure wallet/keys
echo 5. ✅ Sufficient STX for deployment fees
echo.

REM Check if we're in the right directory
if not exist "Clarinet.toml" (
    echo ❌ Error: Clarinet.toml not found. Please run this script from the hyperinsure directory.
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed. Please install Node.js to continue.
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: npm is not installed. Please install npm to continue.
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Parse command line arguments
set DRY_RUN=false
set CORE_ONLY=false
set SKIP_VALIDATION=false
set FORCE=false
set CONFIRMED=false

:parse_args
if "%1"=="--dry-run" (
    set DRY_RUN=true
    shift
    goto parse_args
)
if "%1"=="--core-only" (
    set CORE_ONLY=true
    shift
    goto parse_args
)
if "%1"=="--skip-validation" (
    set SKIP_VALIDATION=true
    shift
    goto parse_args
)
if "%1"=="--force" (
    set FORCE=true
    shift
    goto parse_args
)
if "%1"=="--i-understand-this-is-mainnet" (
    set CONFIRMED=true
    shift
    goto parse_args
)
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help
if "%1"=="" goto continue
echo ❌ Unknown option: %1
echo Use --help for usage information.
exit /b 1

:show_help
echo Usage: %0 [options]
echo.
echo ⚠️  WARNING: This deploys to MAINNET with real STX tokens!
echo.
echo Options:
echo   --dry-run                        Simulate deployment without executing
echo   --core-only                      Deploy only core insurance contracts
echo   --skip-validation                Skip tests and validation checks (NOT RECOMMENDED)
echo   --force                          Continue deployment even if tests fail (NOT RECOMMENDED)
echo   --i-understand-this-is-mainnet   Required flag to confirm mainnet deployment
echo   --help, -h                       Show this help message
echo.
echo Examples:
echo   %0 --dry-run
echo   %0 --i-understand-this-is-mainnet
echo   %0 --core-only --i-understand-this-is-mainnet
echo.
echo Security Checklist:
echo   □ Tested thoroughly on testnet
echo   □ Completed security audit
echo   □ All tests passing
echo   □ Secure wallet setup
echo   □ Sufficient STX for fees
exit /b 0

:continue

REM Require confirmation flag for mainnet (unless dry-run)
if "%DRY_RUN%"=="false" if "%CONFIRMED%"=="false" (
    echo ❌ Error: Mainnet deployment requires the --i-understand-this-is-mainnet flag
    echo This is a safety measure to prevent accidental mainnet deployments.
    echo.
    echo Use: %0 --i-understand-this-is-mainnet
    echo Or run with --dry-run to simulate the deployment first.
    exit /b 1
)

REM Check for testnet deployment record
if not exist "deployments\testnet-latest.json" if "%DRY_RUN%"=="false" (
    echo ⚠️  Warning: No testnet deployment record found
    echo It's highly recommended to deploy and test on testnet first.
    echo.
    set /p CONTINUE="Continue anyway? (y/N): "
    if /i not "%CONTINUE%"=="y" (
        echo ❌ Deployment cancelled. Please test on testnet first.
        exit /b 1
    )
)

REM Build deployment command
set DEPLOY_CMD=node scripts/deploy.js mainnet

if "%DRY_RUN%"=="true" (
    set DEPLOY_CMD=%DEPLOY_CMD% --dry-run
    echo 🔍 Running in dry-run mode (no actual deployment)
)

if "%CORE_ONLY%"=="true" (
    set DEPLOY_CMD=%DEPLOY_CMD% --core-only
    echo 📋 Deploying core contracts only
)

if "%SKIP_VALIDATION%"=="true" (
    set DEPLOY_CMD=%DEPLOY_CMD% --skip-validation
    echo ⚠️  Skipping validation checks (NOT RECOMMENDED for mainnet)
)

if "%FORCE%"=="true" (
    set DEPLOY_CMD=%DEPLOY_CMD% --force
    echo ⚠️  Force mode enabled (NOT RECOMMENDED for mainnet)
)

echo.
echo 🎯 Target Network: Stacks MAINNET
echo 💰 Network: REAL STX TOKENS WILL BE USED
echo 📝 Command: %DEPLOY_CMD%
echo.

REM Final confirmation (unless dry-run)
if "%DRY_RUN%"=="false" (
    echo 🚨 FINAL CONFIRMATION 🚨
    echo ========================
    echo You are about to deploy to MAINNET with real STX tokens.
    echo Deployment fees will be charged to your account.
    echo.
    echo Pre-deployment checklist:
    echo □ All tests are passing
    echo □ Security audit completed
    echo □ Testnet deployment successful
    echo □ Wallet is properly configured
    echo □ Sufficient STX for deployment fees
    echo.
    
    set /p FINAL_CONFIRM="Type 'DEPLOY TO MAINNET' to confirm: "
    if not "%FINAL_CONFIRM%"=="DEPLOY TO MAINNET" (
        echo ❌ Deployment cancelled. Confirmation text did not match.
        exit /b 1
    )
    
    echo ⏳ Starting mainnet deployment in 5 seconds...
    echo Press Ctrl+C to cancel...
    timeout /t 5 /nobreak >nul
)

REM Run the deployment
echo 🚀 Starting mainnet deployment...
echo.

%DEPLOY_CMD%
if errorlevel 1 (
    echo.
    echo ❌ MAINNET DEPLOYMENT FAILED!
    echo Please check the error messages above.
    echo Do not retry without understanding and fixing the issue.
    exit /b 1
)

echo.
echo ✅ MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉
echo.

REM Run verification unless it's a dry run
if "%DRY_RUN%"=="false" (
    echo 🔍 Running deployment verification...
    node scripts/verify-deployment.js mainnet
    if errorlevel 1 (
        echo ⚠️  Deployment verification had issues. Please check the output above.
    ) else (
        echo ✅ Deployment verification passed!
    )
)

echo.
echo 🌐 Mainnet Explorer: https://explorer.hiro.so
echo 📊 API Endpoint: https://api.hiro.so
echo.
echo 🎉 Congratulations! Your insurance system is now live on mainnet!
echo.
echo Next steps:
echo 1. 🔍 Monitor the contracts for any issues
echo 2. 💰 Fund the insurance treasury
echo 3. 🚀 Launch the frontend application
echo 4. 📢 Announce the launch to users
echo 5. 📊 Set up monitoring and alerts
echo.
echo ⚠️  Important: Keep monitoring the system closely after launch!
echo.