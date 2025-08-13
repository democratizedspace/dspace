#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"
Write-Host "Running pre-commit checks..." -ForegroundColor Blue
Write-Host "Running Python pre-commit checks..." -ForegroundColor Yellow
if (Get-Command pre-commit -ErrorAction SilentlyContinue) {
    pre-commit run --files $(git diff --cached --name-only)
} else {
    Write-Host "pre-commit not installed; skipping" -ForegroundColor DarkYellow
}

Write-Host "Running lint-staged on changed files..." -ForegroundColor Yellow
npx lint-staged

if ($LASTEXITCODE -ne 0) {
    Write-Host "Pre-commit checks failed. Please fix the issues before committing." -ForegroundColor Red
    exit 1
}

Write-Host "All checks passed!" -ForegroundColor Green
exit 0
