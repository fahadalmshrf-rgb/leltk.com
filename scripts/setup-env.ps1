# Setup environment variables for running the app
# Usage: . .\scripts\setup-env.ps1
# Then run: pnpm run windows:run

param(
  [string]$DatabaseUrl,
  [string]$SessionSecret,
  [string]$DatabasePassword = "P@ssw0rd123!",
  [string]$DatabaseHost = "localhost",
  [string]$DatabasePort = "5432",
  [string]$DatabaseUser = "postgres",
  [string]$DatabaseName = "lailtak"
)

Write-Host "Setting up environment variables..." -ForegroundColor Green
Write-Host ""

# Build DATABASE_URL if individual components provided
if (-not $DatabaseUrl) {
  $DatabaseUrl = "postgresql://$DatabaseUser`:$DatabasePassword@$DatabaseHost`:$DatabasePort/$DatabaseName"
  Write-Host "Building DATABASE_URL from components:"
  Write-Host "  Host: $DatabaseHost"
  Write-Host "  Port: $DatabasePort"
  Write-Host "  User: $DatabaseUser"
  Write-Host "  Database: $DatabaseName"
}

# Use provided SESSION_SECRET or generate one
if (-not $SessionSecret) {
  $SessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
  Write-Host "No SESSION_SECRET provided, generated random key"
}

# Set environment variables
$env:DATABASE_URL = $DatabaseUrl
$env:SESSION_SECRET = $SessionSecret
$env:PORT = 8080

Write-Host ""
Write-Host "Environment variables set:" -ForegroundColor Green
Write-Host "  DATABASE_URL: ****://****@$DatabaseHost`:$DatabasePort/$DatabaseName" -ForegroundColor Gray
Write-Host "  SESSION_SECRET: $(if($SessionSecret.Length -gt 10) { $SessionSecret.Substring(0,10) + '...' } else { '***' })" -ForegroundColor Gray
Write-Host "  PORT: $($env:PORT)" -ForegroundColor Gray
Write-Host ""
Write-Host "Ready to run: pnpm run windows:run" -ForegroundColor Green
Write-Host ""

# Optionally verify database connectivity
if ($DatabaseHost -eq "localhost" -or $DatabaseHost -eq "127.0.0.1") {
  $canConnect = $false
  try {
    $test = [System.Net.Sockets.TcpClient]::new()
    $test.Connect($DatabaseHost, [int]$DatabasePort)
    $test.Dispose()
    $canConnect = $true
  } catch {}
  
  if ($canConnect) {
    Write-Host "✓ Can reach database on $DatabaseHost`:$DatabasePort" -ForegroundColor Green
  } else {
    Write-Host "⚠ Warning: Cannot reach database on $DatabaseHost`:$DatabasePort" -ForegroundColor Yellow
    Write-Host "  Make sure PostgreSQL is running and listening" -ForegroundColor Gray
  }
  Write-Host ""
}
