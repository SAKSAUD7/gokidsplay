# Simple FTP Upload
$creds = & "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp deployment list-publishing-profiles --name ninjapark-frontend --resource-group ninjapark --query "[?publishMethod=='FTP'].{url:publishUrl,user:userName,pass:userPWD}[0]" --output json | ConvertFrom-Json

$ftpHost = ([System.Uri]$creds.url).Host
$ftpBase = ([System.Uri]$creds.url).AbsolutePath

Write-Host "Uploading files to Azure via FTP..."
Write-Host "Host: $ftpHost"

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$files = Get-ChildItem -Path "deploy-extracted" -Recurse -File
$total = $files.Count
$current = 0

foreach ($file in $files) {
    $current++
    $rel = $file.FullName.Substring((Resolve-Path "deploy-extracted").Path.Length + 1).Replace('\', '/')
    $ftpPath = "ftps://$ftpHost$ftpBase/$rel"
    
    Write-Progress -Activity "Uploading files" -Status "$current of $total" -PercentComplete (($current / $total) * 100)
    Write-Host "[$current/$total] $rel"
    
    try {
        $webclient = New-Object System.Net.WebClient
        $webclient.Credentials = New-Object System.Net.NetworkCredential($creds.user, $creds.pass)
        $webclient.UploadFile($ftpPath, $file.FullName)
        $webclient.Dispose()
    }
    catch {
        Write-Host "  Failed: $_" -ForegroundColor Red
    }
}

Write-Host "`nRestarting app..."
& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp restart --name ninjapark-frontend --resource-group ninjapark

Write-Host "`nDone! Visit: https://ninjapark-frontend.azurewebsites.net"
