# Upload files to Azure using Kudu VFS API (more reliable than FTP)
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

Write-Host "Uploading .next folder..." -ForegroundColor Yellow
$nextZip = "C:\Users\saksa\OneDrive\Desktop\yoyopark\ninjainflatablepark11\park1\frontend\deploy-extracted\.next"
if (Test-Path "$nextZip") {
    Compress-Archive -Path "$nextZip\*" -DestinationPath "next-folder.zip" -Force
    
    $url = "$kuduUrl/api/zip/site/wwwroot/.next/"
    Write-Host "Uploading to: $url"
    
    Invoke-RestMethod -Uri $url -Method PUT -InFile "next-folder.zip" -Headers $headers -ContentType "application/zip" -TimeoutSec 600
    Write-Host "✓ .next folder uploaded" -ForegroundColor Green
}

Write-Host "Uploading public folder..." -ForegroundColor Yellow
$publicZip = "C:\Users\saksa\OneDrive\Desktop\yoyopark\ninjainflatablepark11\park1\frontend\deploy-extracted\public"
if (Test-Path "$publicZip") {
    Compress-Archive -Path "$publicZip\*" -DestinationPath "public-folder.zip" -Force
    
    $url = "$kuduUrl/api/zip/site/wwwroot/public/"
    Invoke-RestMethod -Uri $url -Method PUT -InFile "public-folder.zip" -Headers $headers -ContentType "application/zip" -TimeoutSec 600
    Write-Host "✓ public folder uploaded" -ForegroundColor Green
}

Write-Host "`nRestarting app..." -ForegroundColor Yellow
& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp restart --name ninjapark-frontend --resource-group ninjapark

Write-Host "`n✓ Upload complete!" -ForegroundColor Green
Write-Host "Wait 30 seconds then test: https://ninjapark-frontend.azurewebsites.net" -ForegroundColor Cyan
