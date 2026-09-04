# Upload files directly to Azure using Kudu VFS API (file by file)
$ErrorActionPreference = "Stop"

Write-Host "Getting publishing credentials..." -ForegroundColor Cyan
$creds = & "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp deployment list-publishing-profiles `
    --name ninjapark-frontend `
    --resource-group ninjapark `
    --query "[?publishMethod=='MSDeploy'].{user:userName,pass:userPWD}[0]" `
    --output json | ConvertFrom-Json

$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$($creds.user):$($creds.pass)"))
$headers = @{
    Authorization = "Basic $base64Auth"
}

$kuduUrl = "https://ninjapark-frontend.scm.azurewebsites.net"
$localPath = ".\deploy-extracted"

Write-Host "`nUploading server.js..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/server.js" -Method PUT -InFile "$localPath\server.js" -Headers $headers
Write-Host "✓ server.js uploaded" -ForegroundColor Green

Write-Host "`nUploading package.json..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/package.json" -Method PUT -InFile "$localPath\package.json" -Headers $headers
Write-Host "✓ package.json uploaded" -ForegroundColor Green

Write-Host "`nUploading web.config..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/web.config" -Method PUT -InFile "$localPath\web.config" -Headers $headers
Write-Host "✓ web.config uploaded" -ForegroundColor Green

Write-Host "`nCreating .next directory..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/.next/" -Method PUT -Headers $headers -Body $null
Write-Host "✓ .next directory created" -ForegroundColor Green

Write-Host "`nUploading .next folder as ZIP..." -ForegroundColor Yellow
$nextZip = "next-folder.zip"
if (Test-Path $nextZip) { Remove-Item $nextZip }
Compress-Archive -Path "$localPath\.next\*" -DestinationPath $nextZip -Force
Invoke-RestMethod -Uri "$kuduUrl/api/zip/site/wwwroot/.next/" -Method PUT -InFile $nextZip -Headers $headers -ContentType "application/zip"
Write-Host "✓ .next folder uploaded" -ForegroundColor Green

Write-Host "`nCreating public directory..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/public/" -Method PUT -Headers $headers -Body $null
Write-Host "✓ public directory created" -ForegroundColor Green

Write-Host "`nUploading public folder as ZIP..." -ForegroundColor Yellow
$publicZip = "public-folder.zip"
if (Test-Path $publicZip) { Remove-Item $publicZip }
Compress-Archive -Path "$localPath\public\*" -DestinationPath $publicZip -Force
Invoke-RestMethod -Uri "$kuduUrl/api/zip/site/wwwroot/public/" -Method PUT -InFile $publicZip -Headers $headers -ContentType "application/zip"
Write-Host "✓ public folder uploaded" -ForegroundColor Green

Write-Host "`nRestarting app..." -ForegroundColor Yellow
& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp restart --name ninjapark-frontend --resource-group ninjapark

Write-Host "`n✓ Upload complete!" -ForegroundColor Green
Write-Host "Wait 30 seconds then test: https://ninjapark-frontend.azurewebsites.net" -ForegroundColor Cyan
