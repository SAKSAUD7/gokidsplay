# Fix cache:'no-store' in all API route files too
$root = "c:\Users\saksa\OneDrive\Desktop\spinpin\spinpin\frontend\app\api"
$files = Get-ChildItem $root -Recurse -Filter "route.ts"

$fixedCount = 0
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($content -match "cache.*no-store") {
        $newContent = $content `
            -replace "\{\s*cache:\s*'no-store'\s*\}", "{ next: { revalidate: 60 } }" `
            -replace '\{\s*cache:\s*"no-store"\s*\}', '{ next: { revalidate: 60 } }'
        
        if ($newContent -ne $content) {
            [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
            Write-Host "Fixed API route: $($file.FullName.Replace('c:\Users\saksa\OneDrive\Desktop\spinpin\spinpin\frontend\app\api\', ''))"
            $fixedCount++
        }
    }
}

Write-Host ""
Write-Host "Total API routes fixed: $fixedCount"
