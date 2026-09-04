# Upload fixed server.js to Azure
Write-Host "Uploading fixed server.js to Azure..." -ForegroundColor Cyan

# Read the fixed server.js content
$serverJsContent = Get-Content ".\deploy-extracted\server.js" -Raw

# Create a temporary file for upload
$tempFile = "server_fixed.js"
$serverJsContent | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline

Write-Host "File prepared. Now upload via SSH terminal:" -ForegroundColor Yellow
Write-Host ""
Write-Host "In the SSH terminal, run these commands:" -ForegroundColor Green
Write-Host "cd /home/site/wwwroot" -ForegroundColor White
Write-Host "cat > server.js << 'EOF'" -ForegroundColor White
Write-Host $serverJsContent -ForegroundColor Gray
Write-Host "EOF" -ForegroundColor White
Write-Host ""
Write-Host "Or use this one-liner:" -ForegroundColor Green
Write-Host "echo `"const { spawn } = require('child_process'); const path = require('path'); const PORT = process.env.PORT || 8080; console.log('Starting Next.js server on port', PORT); console.log('Current directory:', __dirname); const server = spawn('node', [path.join(__dirname, '.next/standalone/frontend/server.js')], { env: { ...process.env, PORT }, stdio: 'inherit' }); server.on('error', (err) => { console.error('Failed to start server:', err); process.exit(1); }); server.on('exit', (code) => { console.log('Server exited with code:', code); process.exit(code); });`" > /home/site/wwwroot/server.js" -ForegroundColor White

Write-Host "`nAfter uploading, restart the app!" -ForegroundColor Cyan
