# Start-Me-Up.ps1
# Starts both web and cli applications concurrently

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting Claude's Notes..." -ForegroundColor Cyan
Write-Host ""

# Start web app in new terminal
Write-Host "Starting Web App (localhost:3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\web'; npm run dev"

# Start CLI in new terminal
Write-Host "Starting CLI..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\cli'; npm run dev"

Write-Host ""
Write-Host "Both applications starting in separate windows!" -ForegroundColor Cyan
