param(
  [string]$SuperPassword = "P@ssw0rd123!",
  [int]$Port = 5432
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Test-PortListening {
  param([int]$Port)
  try {
    $result = [System.Net.Sockets.TcpClient]::new()
    $result.Connect("127.0.0.1", $Port)
    $result.Dispose()
    return $true
  } catch {
    return $false
  }
}

Write-Host ""
Write-Host "PostgreSQL Windows Setup" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running
Write-Host "Checking for PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service | Where-Object { $_.Name -like "*postgres*" } | Select-Object -First 1
if ($pgService) {
  Write-Host "Found service: $($pgService.DisplayName)" -ForegroundColor Green
  if (Test-PortListening -Port $Port) {
    Write-Host "✓ PostgreSQL is running on port $Port" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to launch app with:"  -ForegroundColor Green
    Write-Host "  pnpm run windows:run" -ForegroundColor Cyan
    exit 0
  } else {
    Write-Host "Service exists but not listening. Trying to start..." -ForegroundColor Yellow
    Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
    Start-Sleep 2
    if (Test-PortListening -Port $Port) {
      Write-Host "✓ PostgreSQL started successfully" -ForegroundColor Green
      exit 0
    }
  }
}

Write-Host "PostgreSQL not found. Installing..." -ForegroundColor Yellow
Write-Host ""

# Download attempts
$installerPath = $null
$tempFile = "$env:TEMP\postgresql-installer.exe"

$mirrors = @(
  "https://www.postgresql.org/ftp/binary/v18.0/win64/postgresql-18.0-1-windows-x64.exe",
  "https://sbp.enterprisedb.com/getfile.jsp?fileid=1262139"
)

foreach ($url in $mirrors) {
  Write-Host "Downloading from $url..." -NoNewline
  try {
    Invoke-WebRequest -Uri $url -OutFile $tempFile -UseBasicParsing -TimeoutSec 40 | Out-Null
    
    # Check if valid exe
    $bytes = [System.IO.File]::ReadAllBytes($tempFile) | Select-Object -First 2
    if ($bytes[0] -eq 0x4D -and $bytes[1] -eq 0x5A) {
      Write-Host " ✓" -ForegroundColor Green
      $installerPath = $tempFile
      break
    } else {
      Write-Host " ✗ (invalid)" -ForegroundColor Red
    }
  } catch {
    Write-Host " ✗ ($($_.Exception.Message.Split([Environment]::NewLine)[0]))" -ForegroundColor Red
  }
}

if ($installerPath) {
  Write-Host ""
  Write-Host "Running installer..." -ForegroundColor Yellow
  
  & $installerPath `
    --mode unattended `
    --unattendedmodeui minimal `
    --superpassword $SuperPassword `
    --servicename "postgresql" `
    --servicepassword $SuperPassword `
    --serverport $Port `
    --enable-stackbuilder 0 `
    2>&1 | Out-Null
  
  Start-Sleep 5
  
  $file = Remove-Item $installerPath -Force -PassThru -ErrorAction SilentlyContinue
  
  if (Test-PortListening -Port $Port) {
    Write-Host "✓ PostgreSQL installed and running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Credentials:" -ForegroundColor Green
    Write-Host "  User: postgres" -ForegroundColor Gray
    Write-Host "  Password: $SuperPassword" -ForegroundColor Gray
    exit 0
  } else {
    Write-Host "Installation completed but port not responding yet..." -ForegroundColor Yellow
    exit 0
  }
} else {
  Write-Host ""
  Write-Host "Could not download PostgreSQL automatically" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "MANUAL INSTALLATION:" -ForegroundColor Cyan
  Write-Host "1. Go to: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
  Write-Host "2. Download PostgreSQL 18 Windows installer"
  Write-Host "3. Run installer with port 5432, user 'postgres', password '$SuperPassword'"
  Write-Host ""
  exit 1
}
