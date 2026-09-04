# Fix all localhost:8000 references in frontend
$root = "c:\Users\saksa\OneDrive\Desktop\spinpin\spinpin\frontend"
$files = Get-ChildItem $root -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.FullName -notlike "*node_modules*" }

$fixedCount = 0
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($content -match "localhost:8000") {
        $content = $content.Replace("http://localhost:8000/api/v1", "http://localhost:9000/api/v1")
        $content = $content.Replace("http://localhost:8000", "http://localhost:9000")
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed port: $($file.Name)"
        $fixedCount++
    }
}

Write-Host ""
Write-Host "Total files fixed: $fixedCount"
