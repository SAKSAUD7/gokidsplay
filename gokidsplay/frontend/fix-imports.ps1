# Fix corrupted import statements
$files = Get-ChildItem -Path "app\(admin-portal)\admin\cms" -Recurse -Filter "*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix corrupted imports: from '@/...') as any[]; -> from '@/...';
    $content = $content -replace "from '@/([^']+)'\) as any\[\];", "from '@/`$1';"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Fixed all corrupted import statements"
