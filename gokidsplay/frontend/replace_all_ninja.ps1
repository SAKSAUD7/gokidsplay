# PowerShell script to replace all Ninja/Inflatable references with SpinPin
# Run from frontend directory

$replacements = @{
    "Ninja Inflatable Park" = "Spin Pin"
    "Ninja Inflatable" = "Spin Pin"
    "Ninja Park" = "Spin Pin"
    "ninja park" = "Spin Pin"
    "inflatable park" = "entertainment venue"
    "inflatable adventure park" = "entertainment venue"
    "inflatable activities" = "activities"
    "inflatables" = "equipment"
    "Ninja Warrior" = "Adults"
    "Little Ninjas" = "Kids"
    "Ninja Marshals" = "Staff Members"
    "Ninja Grip Socks" = "Grip Socks"
    "Ninja Cafe" = "Cafe"
    "ninjainflatablepark" = "spinpinleicester"
    "info@ninjainflatablepark.com" = "info@spinpin.co.uk"
    "Bangalore" = "Leicester"
    "India's biggest" = "Leicester's premier"
    "India's largest" = "Leicester's first"
    "India's #1" = "Leicester's top"
    "20,000 square feet" = "entertainment space"
    "11+ unique zones" = "multiple activities"
    "Layarda Hoshalli, Bangalore 560083" = "Ramdoot House, First Floor - 2/3 Navigation Street, Leicester, LE13UR"
}

# Files to process
$files = Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts,*.jsx,*.js -Exclude node_modules,*.min.js

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $false
    
    foreach ($key in $replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nReplacement complete!"
