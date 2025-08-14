#!/usr/bin/env pwsh
$ErrorActionPreference = "Continue"
Write-Host "Refreshing new quests list..." -ForegroundColor Blue
npm run new-quests:update | Out-Null
exit 0
