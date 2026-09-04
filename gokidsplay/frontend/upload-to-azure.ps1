# Upload files to Azure App Service via Kudu VFS API
$appName = "spinpin-frontend"
$resourceGroup = "spinpin-rg"

# Get publishing credentials
Write-Host "Getting publishing credentials..."
$creds = & "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp deployment list-publishing-profiles `
    --name $appName `
    --resource-group $resourceGroup `
    --query "[?publishMethod=='MSDeploy'].{user:userName,pass:userPWD}[0]" `
    --output json | ConvertFrom-Json

$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$($creds.user):$($creds.pass)"))
$headers = @{
    Authorization = "Basic $base64Auth"
}

$kuduUrl = "https://$appName.scm.azurewebsites.net"

# Function to upload file
function Upload-File {
    param($localPath, $remotePath)
    
    $url = "$kuduUrl/api/vfs/site/wwwroot/$remotePath"
    Write-Host "Uploading: $remotePath"
    
    try {
        Invoke-RestMethod -Uri $url -Method PUT -InFile $localPath -Headers $headers -ContentType "application/octet-stream"
        Write-Host "  ✓ Uploaded successfully"
    }
    catch {
        Write-Host "  ✗ Failed: $_"
    }
}

# Function to create directory
function Create-Directory {
    param($remotePath)
    
    $url = "$kuduUrl/api/vfs/site/wwwroot/$remotePath/"
    Write-Host "Creating directory: $remotePath"
    
    try {
        Invoke-RestMethod -Uri $url -Method PUT -Headers $headers
        Write-Host "  ✓ Created successfully"
    }
    catch {
        Write-Host "  ✗ Failed (may already exist): $_"
    }
}

# Upload files
Write-Host "`nStarting upload..."

# Upload server.js
Upload-File -localPath "deploy-extracted\server.js" -remotePath "server.js"

# Create .next directory structure
Create-Directory -remotePath ".next"
Create-Directory -remotePath ".next/standalone"
Create-Directory -remotePath ".next/static"

# Upload .next/standalone files (this will take a while)
Write-Host "`nUploading .next/standalone directory..."
Get-ChildItem -Path "deploy-extracted\.next\standalone" -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring((Resolve-Path "deploy-extracted\.next\standalone").Path.Length + 1)
    $remotePath = ".next/standalone/$($relativePath.Replace('\', '/'))"
    
    # Create parent directory if needed
    $parentDir = Split-Path $remotePath -Parent
    if ($parentDir) {
        Create-Directory -remotePath $parentDir
    }
    
    Upload-File -localPath $_.FullName -remotePath $remotePath
}

# Upload .next/static files
Write-Host "`nUploading .next/static directory..."
Get-ChildItem -Path "deploy-extracted\.next\static" -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring((Resolve-Path "deploy-extracted\.next\static").Path.Length + 1)
    $remotePath = ".next/static/$($relativePath.Replace('\', '/'))"
    
    $parentDir = Split-Path $remotePath -Parent
    if ($parentDir) {
        Create-Directory -remotePath $parentDir
    }
    
    Upload-File -localPath $_.FullName -remotePath $remotePath
}

# Upload public files
Write-Host "`nUploading public directory..."
Create-Directory -remotePath "public"
Get-ChildItem -Path "deploy-extracted\public" -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring((Resolve-Path "deploy-extracted\public").Path.Length + 1)
    $remotePath = "public/$($relativePath.Replace('\', '/'))"
    
    Upload-File -localPath $_.FullName -remotePath $remotePath
}

Write-Host "`n✓ Upload complete!"
Write-Host "Restarting app..."

# Restart the app
& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp restart --name $appName --resource-group $resourceGroup

Write-Host "`n✓ Done! Check your site at: https://$appName.azurewebsites.net"
