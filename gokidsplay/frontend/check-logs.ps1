# Check Azure App Service logs
Write-Host "Fetching application logs..." -ForegroundColor Cyan

# Method 1: Check via Kudu API
$kuduUrl = "https://ninjapark-frontend.scm.azurewebsites.net"
$creds = "REDACTED:REDACTED"
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($creds))
$headers = @{ Authorization = "Basic $base64Auth" }

try {
    Write-Host "`nFetching Docker logs..." -ForegroundColor Yellow
    $logs = Invoke-RestMethod -Uri "$kuduUrl/api/logs/docker" -Headers $headers -Method GET
    $logs | Select-Object -Last 100
}
catch {
    Write-Host "Error fetching logs: $_" -ForegroundColor Red
}

Write-Host "`nTo view logs in real-time, go to:" -ForegroundColor Cyan
Write-Host "https://ninjapark-frontend.scm.azurewebsites.net/api/logstream" -ForegroundColor Green
