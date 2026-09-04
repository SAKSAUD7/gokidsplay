$appName = "spinpin-frontend"
$resourceGroup = "spinpin-rg"
$az = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"

Write-Host "=== SpinPin Azure Deployment ===" -ForegroundColor Cyan
Write-Host ""

# 1. Build zip from standalone output
$zipPath = "$PSScriptRoot\deploy.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

$standaloneDir = "$PSScriptRoot\.next\standalone"
if (-not (Test-Path $standaloneDir)) {
    Write-Host "ERROR: .next/standalone not found. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

Write-Host "Packaging build output into deploy.zip..." -ForegroundColor Yellow

# Copy static assets into standalone so they're bundled together
$staticSrc  = "$PSScriptRoot\.next\static"
$staticDest = "$standaloneDir\frontend\.next\static"
if (-not (Test-Path $staticDest)) {
    Copy-Item -Recurse -Force $staticSrc $staticDest
}

$publicSrc  = "$PSScriptRoot\public"
$publicDest = "$standaloneDir\frontend\public"
if (-not (Test-Path $publicDest)) {
    Copy-Item -Recurse -Force $publicSrc $publicDest
}

# Copy server.js if it exists at standalone root
$serverJs = "$PSScriptRoot\server.js"
if (Test-Path $serverJs) {
    Copy-Item -Force $serverJs "$standaloneDir\server.js"
}

# Compress the standalone directory
Compress-Archive -Path "$standaloneDir\*" -DestinationPath $zipPath -Force
Write-Host "  Created: $zipPath" -ForegroundColor Green
Write-Host ""

# 2. Deploy via az CLI zip deploy
Write-Host "Deploying to Azure App Service '$appName'..." -ForegroundColor Yellow
& $az webapp deploy `
    --name $appName `
    --resource-group $resourceGroup `
    --src-path $zipPath `
    --type zip `
    --async false

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Deployment complete!" -ForegroundColor Green
    Write-Host "Restarting app..." -ForegroundColor Yellow
    & $az webapp restart --name $appName --resource-group $resourceGroup
    Write-Host ""
    Write-Host "Site live at: https://spinpin.uk" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ERROR: Deployment failed. Check output above." -ForegroundColor Red
    exit 1
}
