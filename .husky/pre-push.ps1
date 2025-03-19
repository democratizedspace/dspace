#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

Write-Host "Running pre-push checks..." -ForegroundColor Blue

# Run linting checks
Write-Host "Running code quality checks..." -ForegroundColor Yellow
npm run check

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Code quality checks failed. Please fix issues before pushing." -ForegroundColor Red
    exit 1
}

# Run all tests (unit tests and e2e tests)
Write-Host "Running unit tests..." -ForegroundColor Yellow
cd frontend
npx jest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Unit tests failed. Please fix failing tests before pushing." -ForegroundColor Red
    exit 1
}

# Run e2e tests using the npm script in the frontend directory
Write-Host "Running e2e tests..." -ForegroundColor Yellow
npm run test:e2e
    
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ E2E tests failed. Please fix failing tests before pushing." -ForegroundColor Red
    exit 1
}

cd ..

Write-Host "✅ All pre-push checks passed!" -ForegroundColor Green
exit 0 