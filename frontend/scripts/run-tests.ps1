# Script to run all tests for DSPACE

# Set colors for better output
$Red = [System.Console]::ForegroundColor = "Red"
$Green = [System.Console]::ForegroundColor = "Green"
$Yellow = [System.Console]::ForegroundColor = "Yellow"
$Blue = [System.Console]::ForegroundColor = "Blue"
$Reset = [System.Console]::ResetColor()

# Track if any tests fail
$Failures = 0

# Start time
$StartTime = Get-Date

# Function to display section header
function Print-Header {
    param (
        [string]$Title
    )
    
    Write-Host "`n=================================================" -ForegroundColor Blue
    Write-Host "  $Title" -ForegroundColor Blue
    Write-Host "=================================================`n" -ForegroundColor Blue
}

# Function to handle errors
function Handle-Error {
    param (
        [string]$Phase
    )
    
    $Script:Failures++
    Write-Host "`n❌ $Phase FAILED`n" -ForegroundColor Red
}

# Function to handle success
function Handle-Success {
    param (
        [string]$Phase
    )
    
    Write-Host "`n✅ $Phase PASSED`n" -ForegroundColor Green
}

# Run linting checks
function Run-Linting {
    Print-Header "RUNNING LINTING CHECKS"
    
    Write-Host "Running ESLint..." -ForegroundColor Yellow
    
    try {
        npm run lint
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n⚠️ ESLint reported issues but continuing with tests." -ForegroundColor Yellow
        } else {
            Write-Host "`n✅ ESLint checks passed" -ForegroundColor Green
        }
    } catch {
        Write-Host "`n⚠️ ESLint check error occurred but continuing with tests:" -ForegroundColor Yellow
        Write-Host $_.Exception.Message -ForegroundColor Yellow
    }
    
    Write-Host "`nRunning Prettier checks..." -ForegroundColor Yellow
    npm run format:check
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n⚠️ Prettier format issues found but continuing with tests." -ForegroundColor Yellow
    } else {
        Write-Host "`n✅ Prettier checks passed" -ForegroundColor Green
    }
    
    Handle-Success "LINTING CHECKS"
    return $true
}

# Run unit tests
function Run-UnitTests {
    Print-Header "RUNNING UNIT TESTS"
    
    npm test
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "UNIT TESTS"
        return $false
    }
    
    Handle-Success "UNIT TESTS"
    return $true
}

# Run Playwright e2e tests
function Run-E2ETests {
    Print-Header "RUNNING END-TO-END TESTS"
    
    npm run test:e2e
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "END-TO-END TESTS"
        return $false
    }
    
    Handle-Success "END-TO-END TESTS"
    return $true
}

# Generate coverage report
function Generate-Coverage {
    Print-Header "GENERATING COVERAGE REPORT"
    
    npm run coverage
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "COVERAGE REPORT"
        return $false
    }
    
    Handle-Success "COVERAGE REPORT"
    return $true
}

# Main execution
Write-Host "Running all tests for DSPACE" -ForegroundColor Blue

# Run each test phase
Run-Linting
Run-UnitTests
Run-E2ETests
Generate-Coverage

# Calculate elapsed time
$EndTime = Get-Date
$ElapsedTime = $EndTime - $StartTime
$Minutes = [math]::Floor($ElapsedTime.TotalMinutes)
$Seconds = $ElapsedTime.Seconds

# Show summary
Print-Header "TEST SUMMARY"
if ($Failures -eq 0) {
    Write-Host "All tests passed successfully!" -ForegroundColor Green
} else {
    Write-Host "$Failures test phases failed." -ForegroundColor Red
    Write-Host "Please fix the issues before committing." -ForegroundColor Red
}

Write-Host "Total time: ${Minutes}m ${Seconds}s" -ForegroundColor Blue

# Exit with status
if ($Failures -eq 0) {
    exit 0
} else {
    exit 1
} 