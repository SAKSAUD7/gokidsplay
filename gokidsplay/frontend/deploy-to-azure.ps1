# Deploy to Azure via Kudu ZipDeploy API
$zipFile = "c:\Users\saksa\OneDrive\Desktop\yoyopark\ninjainflatablepark11\park1\frontend\deploy.zip"
$appName = "ninjapark-frontend"
$kuduUrl = "https://$appName.scm.azurewebsites.net/api/zipdeploy"

Write-Host "Deploying to Azure..." -ForegroundColor Cyan
Write-Host "This will upload and extract the zip to /home/site/wwwroot/" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $kuduUrl -Method POST -InFile $zipFile -ContentType "application/zip" -UseDefaultCredentials
    Write-Host "✓ Deployment successful!" -ForegroundColor Green
    Write-Host "Files are now permanently deployed." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Go to Azure Portal" -ForegroundColor White
    Write-Host "2. Restart ninjapark-frontend" -ForegroundColor White
    Write-Host "3. Test: https://ninjapark-frontend.azurewebsites.net" -ForegroundColor White
}
catch {
    Write-Host "✗ Deployment failed: $_" -ForegroundColor Red
    Write-Host "`nAlternative: Upload deploy.zip manually" -ForegroundColor Yellow
    Write-Host "1. Go to: https://ninjapark-frontend.scm.azurewebsites.net/ZipDeployUI" -ForegroundColor White
    Write-Host "2. Drag deploy.zip to the page" -ForegroundColor White
    Write-Host "3. Wait for extraction to complete" -ForegroundColor White
}
