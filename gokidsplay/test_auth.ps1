# Test Authentication Flow

$email = "test@ninjapark.com"
$password = "testpass123"

Write-Host "Step 1: Getting token from /api/token/" -ForegroundColor Yellow
$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/token/" -Method POST -Body $body -ContentType "application/json"
    $token = $response.access
    Write-Host "✓ Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    Write-Host "`nStep 2: Using token to call /api/v1/core/users/me/" -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $userResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/core/users/me/" -Method GET -Headers $headers
    Write-Host "✓ User data retrieved successfully!" -ForegroundColor Green
    Write-Host "User: $($userResponse.email) | Role: $($userResponse.role)" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
