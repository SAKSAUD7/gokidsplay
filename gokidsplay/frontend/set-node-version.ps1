& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp config set `
    --name ninjapark-frontend `
    --resource-group ninjapark `
    --linux-fx-version "NODE|20-lts"

& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" webapp restart `
    --name ninjapark-frontend `
    --resource-group ninjapark

Write-Host "Node version set to 20-lts and app restarted"
Write-Host "Please wait 30 seconds then test: https://ninjapark-frontend.azurewebsites.net"
