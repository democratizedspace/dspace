#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

Write-Host "Running pre-push checks..." -ForegroundColor Blue

npm run check
npm run test:root

Write-Host "✅ All pre-push checks passed!" -ForegroundColor Green
exit 0
