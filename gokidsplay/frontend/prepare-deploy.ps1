if (Test-Path "deploy-extracted") { Remove-Item -Recurse -Force "deploy-extracted" }
New-Item -ItemType Directory -Path "deploy-extracted\.next"
Copy-Item -Path ".next\standalone" -Destination "deploy-extracted\.next\standalone" -Recurse
Copy-Item -Path ".next\static" -Destination "deploy-extracted\.next\static" -Recurse
Copy-Item -Path "public" -Destination "deploy-extracted\public" -Recurse
Copy-Item -Path "server.js" -Destination "deploy-extracted\server.js"
