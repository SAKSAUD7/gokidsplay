# FTP Upload Script for Azure App Service
# This script uploads all files from deploy-extracted to Azure

$ErrorActionPreference = "Stop"

Write-Host "=== Azure FTP Deployment Script ===" -ForegroundColor Cyan
Write-Host ""

# Get FTP credentials
Write-Host "Getting FTP credentials..." -ForegroundColor Yellow
$ftpInfo = & "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp deployment list-publishing-profiles `
    --name ninjapark-frontend `
    --resource-group ninjapark `
    --query "[?publishMethod=='FTP'].{url:publishUrl,user:userName,pass:userPWD}[0]" `
    --output json | ConvertFrom-Json

$ftpUrl = $ftpInfo.url
$ftpUser = $ftpInfo.user
$ftpPass = $ftpInfo.pass

# Parse FTP URL
$ftpHost = ([System.Uri]$ftpUrl).Host
$ftpPath = ([System.Uri]$ftpUrl).AbsolutePath

Write-Host "FTP Host: $ftpHost" -ForegroundColor Green
Write-Host "FTP Path: $ftpPath" -ForegroundColor Green
Write-Host ""

# Create FTP request function
function Upload-FtpFile {
    param(
        [string]$LocalFile,
        [string]$RemotePath
    )
    
    try {
        $ftpUri = "ftps://$ftpHost$RemotePath"
        $request = [System.Net.FtpWebRequest]::Create($ftpUri)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $request.EnableSsl = $true
        $request.UsePassive = $true
        
        # Ignore SSL certificate errors
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
        
        $fileContent = [System.IO.File]::ReadAllBytes($LocalFile)
        $request.ContentLength = $fileContent.Length
        
        $requestStream = $request.GetRequestStream()
        $requestStream.Write($fileContent, 0, $fileContent.Length)
        $requestStream.Close()
        
        $response = $request.GetResponse()
        $response.Close()
        
        return $true
    }
    catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
}

# Create FTP directory function
function Create-FtpDirectory {
    param([string]$RemotePath)
    
    try {
        $ftpUri = "ftps://$ftpHost$RemotePath"
        $request = [System.Net.FtpWebRequest]::Create($ftpUri)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $request.EnableSsl = $true
        $request.UsePassive = $true
        
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
        
        $response = $request.GetResponse()
        $response.Close()
        return $true
    }
    catch {
        # Directory might already exist, that's okay
        return $false
    }
}

Write-Host "Starting file upload..." -ForegroundColor Yellow
Write-Host ""

$sourceDir = "deploy-extracted"
$uploadedCount = 0
$failedCount = 0

# Get all files
$allFiles = Get-ChildItem -Path $sourceDir -Recurse -File

Write-Host "Found $($allFiles.Count) files to upload" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Substring((Resolve-Path $sourceDir).Path.Length)
    $remotePath = "$ftpPath$($relativePath.Replace('\', '/'))"
    
    # Create parent directory
    $parentDir = Split-Path $remotePath -Parent
    if ($parentDir -ne $ftpPath) {
        Create-FtpDirectory -RemotePath $parentDir | Out-Null
    }
    
    Write-Host "Uploading: $relativePath" -NoNewline
    
    if (Upload-FtpFile -LocalFile $file.FullName -RemotePath $remotePath) {
        Write-Host " ✓" -ForegroundColor Green
        $uploadedCount++
    }
    else {
        Write-Host " ✗" -ForegroundColor Red
        $failedCount++
    }
}

Write-Host ""
Write-Host "=== Upload Complete ===" -ForegroundColor Cyan
Write-Host "Uploaded: $uploadedCount files" -ForegroundColor Green
Write-Host "Failed: $failedCount files" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failedCount -eq 0) {
    Write-Host "Restarting app..." -ForegroundColor Yellow
    & "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp restart --name ninjapark-frontend --resource-group ninjapark
    
    Write-Host ""
    Write-Host "✓ Deployment complete!" -ForegroundColor Green
    Write-Host "Visit: https://ninjapark-frontend.azurewebsites.net" -ForegroundColor Cyan
}
else {
    Write-Host "Some files failed to upload. Please retry or check FTP credentials." -ForegroundColor Red
}
