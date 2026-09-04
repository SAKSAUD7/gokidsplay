# Upload files directly to Azure using provided FTP credentials
$ErrorActionPreference = "Stop"

# Credentials from Azure Deployment Center
$ftpUser = "REDACTED"
$ftpPass = "REDACTED"

$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${ftpUser}:${ftpPass}"))
$headers = @{
    Authorization = "Basic $base64Auth"
}

$kuduUrl = "https://ninjapark-frontend.scm.azurewebsites.net"
$localPath = ".\deploy-extracted"

try {
    Write-Host "Uploading server.js..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/server.js" -Method PUT -InFile "$localPath\server.js" -Headers $headers
    Write-Host "✓ server.js uploaded" -ForegroundColor Green

    Write-Host "`nUploading package.json..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/package.json" -Method PUT -InFile "$localPath\package.json" -Headers $headers
    Write-Host "✓ package.json uploaded" -ForegroundColor Green

    Write-Host "`nUploading web.config..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/web.config" -Method PUT -InFile "$localPath\web.config" -Headers $headers
    Write-Host "✓ web.config uploaded" -ForegroundColor Green

    Write-Host "`nCreating .next folder ZIP..." -ForegroundColor Yellow
    $nextZip = "next-folder.zip"
    if (Test-Path $nextZip) { Remove-Item $nextZip }
    Compress-Archive -Path "$localPath\.next\*" -DestinationPath $nextZip -Force
    Write-Host "ZIP created, uploading..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$kuduUrl/api/zip/site/wwwroot/.next/" -Method PUT -InFile $nextZip -Headers $headers -ContentType "application/zip" -TimeoutSec 600
    Write-Host "✓ .next folder uploaded and extracted" -ForegroundColor Green

    Write-Host "`nCreating public folder ZIP..." -ForegroundColor Yellow
    $publicZip = "public-folder.zip"
    if (Test-Path $publicZip) { Remove-Item $publicZip }
    Compress-Archive -Path "$localPath\public\*" -DestinationPath $publicZip -Force
    Write-Host "ZIP created, uploading..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$kuduUrl/api/zip/site/wwwroot/public/" -Method PUT -InFile $publicZip -Headers $headers -ContentType "application/zip" -TimeoutSec 600
    Write-Host "✓ public folder uploaded and extracted" -ForegroundColor Green

    Write-Host "`n✓ Upload complete!" -ForegroundColor Green
    Write-Host "`nWait 30 seconds, then test: https://ninjapark-frontend.azurewebsites.net" -ForegroundColor Cyan
}
catch {
    Write-Host "`n✗ Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
