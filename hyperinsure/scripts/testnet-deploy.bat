@echo off
REM HyperInsure Testnet Deployment Script for Windows
REM This script deploys the insurance claim verification system to Stacks testnet

echo 🚀 Starting HyperInsure Testnet Deployment
echo ==========================================

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
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help
if "%1"=="" goto continue
echo ❌ Unknown option: %1
echo Use --help for usage information.
exit /b 1

:show_help
echo Usage: %0 [options]
echo.
echo Options:
echo   --dry-run         Simulate deployment without executing
echo   --core-only       Deploy only core insurance contracts
echo   --skip-validation Skip tests and validation checks
echo   --force           Continue deployment even if tests fail
echo   --help, -h        Show this help message
echo.
echo Examples:
echo   %0 --dry-run
echo   %0 --core-only
echo   %0 --skip-validation
exit /b 0

:continue

REM Build deployment command
set DEPLOY_CMD=node scripts/deploy.js testnet

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
    echo ⚠️  Skipping validation checks
)

if "%FORCE%"=="true" (
    set DEPLOY_CMD=%DEPLOY_CMD% --force
    echo ⚠️  Force mode enabled
)

echo.
echo 🎯 Target Network: Stacks Testnet
echo 📝 Command: %DEPLOY_CMD%
echo.

REM Confirm deployment (unless dry-run)
if "%DRY_RUN%"=="false" (
    set /p CONFIRM="Are you sure you want to deploy to testnet? (y/N): "
    if /i not "%CONFIRM%"=="y" (
        echo ❌ Deployment cancelled.
        exit /b 1
    )
)

REM Run the deployment
echo 🚀 Starting deployment...
echo.

%DEPLOY_CMD%
if errorlevel 1 (
    echo.
    echo ❌ Testnet deployment failed!
    echo Please check the error messages above and try again.
    exit /b 1
)

echo.
echo ✅ Testnet deployment completed successfully!
echo.

REM Run verification unless it's a dry run
if "%DRY_RUN%"=="false" (
    echo 🔍 Running deployment verification...
    node scripts/verify-deployment.js testnet
    if errorlevel 1 (
        echo ⚠️  Deployment verification had issues. Please check the output above.
    ) else (
        echo ✅ Deployment verification passed!
    )
)

echo.
echo 🌐 Testnet Explorer: https://explorer.hiro.so/?chain=testnet
echo 📊 API Endpoint: https://api.testnet.hiro.so
echo.
echo Next steps:
echo 1. Test the deployed contracts using the frontend
echo 2. Run integration tests with real Bitcoin data
echo 3. Prepare for mainnet deployment when ready
echo.