# Fix all server actions: replace cache:'no-store' GET fetches with 60s revalidation
# NOTE: POST/mutation fetches keep cache:'no-store' (they must always be fresh)
$root = "c:\Users\saksa\OneDrive\Desktop\spinpin\spinpin\frontend\app\actions"
$files = Get-ChildItem $root -Filter "*.ts"

$fixedCount = 0
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($content -match "cache.*no-store|no-store.*cache") {
        # Only replace standalone read-only fetch options, not inside POST/mutation blocks
        # Strategy: replace { cache: 'no-store' } and { cache: "no-store" } in GET-style fetches
        $newContent = $content `
            -replace "\{\s*cache:\s*'no-store'\s*\}", "{ next: { revalidate: 60 } }" `
            -replace '\{\s*cache:\s*"no-store"\s*\}', '{ next: { revalidate: 60 } }'
        
        if ($newContent -ne $content) {
            [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
            Write-Host "Fixed: $($file.Name)"
            $fixedCount++
        }
    }
}

Write-Host ""
Write-Host "Total actions fixed: $fixedCount"
