$sourceFile = "c:\Users\saksa\OneDrive\Desktop\yoyopark\ninjainflatablepark11\park1\frontend\server-azure-clean.js"
$appName = "ninjapark-frontend"
$targetPath = "/site/wwwroot/server.js"

Write-Host "Uploading server.js to Azure..." -ForegroundColor Cyan

# Read the file content
$content = Get-Content $sourceFile -Raw

# Upload using Kudu VFS API
$kuduUrl = "https://$appName.scm.azurewebsites.net/api/vfs$targetPath"

try {
    Invoke-RestMethod -Uri $kuduUrl -Method PUT -Body $content -ContentType "application/octet-stream" -UseDefaultCredentials
    Write-Host "✓ File uploaded successfully!" -ForegroundColor Green
    Write-Host "Now restart the app in Azure Portal and test the website." -ForegroundColor Yellow
}
catch {
    Write-Host "✗ Upload failed: $_" -ForegroundColor Red
    Write-Host "Please use SSH method instead." -ForegroundColor Yellow
}
