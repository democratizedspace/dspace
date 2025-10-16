# PowerShell script to run before submitting a PR
# This script runs all necessary checks to ensure the PR is ready for review

Write-Host "Running pre-PR checks for DSPACE..."
Write-Host "====================================="

# Store original directory to return at end
$originalDir = Get-Location

# Navigate to frontend directory if needed
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path "$scriptDir\.."

try {
    # Ensure Playwright browsers are installed
    Write-Host "Ensuring Playwright browsers are installed..."
    npx playwright install > $null 2>&1

    # Step 1: Run linting and formatting
    Write-Host "Step 1/3: Checking code formatting and linting..."
    npm run check
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Formatting or linting issues found. Please fix them before submitting your PR." -ForegroundColor Red
        Set-Location -Path $originalDir
        exit 1
    }
    Write-Host "✅ Code formatting and linting passed!" -ForegroundColor Green

    # Step 2: Run unit tests unless skipped
    if (-not $env:SKIP_UNIT_TESTS) {
        Write-Host "`nStep 2/3: Running unit tests..."
        $testOutput = npm run test:root 2>&1
        Write-Host $testOutput
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Unit tests failed. Please fix them before submitting your PR." -ForegroundColor Red
            Set-Location -Path $originalDir
            exit 1
        }
        if ($testOutput -match 'Test Files\s+0' -or $testOutput -match 'Tests\s+0' -or $testOutput -match 'No test files? found') {
            Write-Warning "No unit tests were run."
        }
        Write-Host "✅ Unit tests passed!" -ForegroundColor Green
    } else {
        Write-Host "`nStep 2/3: Skipping unit tests..."
    }

    # Step 3: Run grouped E2E tests
    Write-Host "`nStep 3/3: Running end-to-end tests (grouped)..."
    $e2eOutput = npm run test:e2e:groups 2>&1
    Write-Host $e2eOutput
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ End-to-end tests failed. Please fix them before submitting your PR." -ForegroundColor Red
        Set-Location -Path $originalDir
        exit 1
    }
    if ($e2eOutput -match 'Test Files\s+0' -or $e2eOutput -match 'Tests\s+0' -or $e2eOutput -match 'No test files? found') {
        Write-Warning "No end-to-end tests were run."
    }
    Write-Host "✅ End-to-end tests passed!" -ForegroundColor Green

    # All done!
    Write-Host "`n🎉 All tests passed! Your PR is ready for submission." -ForegroundColor Green
    Write-Host "Don't forget to update any relevant documentation if you've added new features."
}
finally {
    # Return to original directory
    Set-Location -Path $originalDir
} 
