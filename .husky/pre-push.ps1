#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

Write-Host "Running pre-push checks..." -ForegroundColor Blue

# Run type checking
Write-Host "Running code quality checks..." -ForegroundColor Yellow
npm run check

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Code quality checks failed. Please fix issues before pushing." -ForegroundColor Red
    exit 1
}

# Run all tests (unit tests only, not e2e tests which are slow)
Write-Host "Running tests..." -ForegroundColor Yellow
cd frontend
npx jest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed. Please fix failing tests before pushing." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All pre-push checks passed!" -ForegroundColor Green
exit 0 