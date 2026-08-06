param(
  [string]$SuperPassword = "P@ssw0rd123!",
  [string]$Port = "5432",
  [string]$InstallPath = "C:\Program Files\PostgreSQL\18"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host ""
Write-Host "PostgreSQL Setup for Windows" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is already installed
function Test-PostgresInstalled {
  $services = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like "*postgres*" }
  return ($services | Measure-Object).Count -gt 0
}

# Check if port is listening
function Test-PortListening {
  param([int]$Port)
  try {
    $result = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    return $result.TcpTestSucceeded
  } catch {
    return $false
  }
}

Write-Host "Checking for existing PostgreSQL installation..." -ForegroundColor Yellow
if (Test-PostgresInstalled) {
  Write-Host "✓ PostgreSQL service found" -ForegroundColor Green
  if (Test-PortListening -Port $Port) {
    Write-Host "✓ PostgreSQL is running on port $Port" -ForegroundColor Green
    exit 0
  } else {
    Write-Host "✗ PostgreSQL service exists but port $Port is not listening" -ForegroundColor Red
    Write-Host "  Try: net start postgres*" -ForegroundColor Yellow
    exit 1
  }
}

Write-Host "✗ PostgreSQL not found" -ForegroundColor Red
Write-Host ""
Write-Host "Attempting automated download and installation..." -ForegroundColor Yellow
Write-Host ""

# List of download mirrors to try
$downloadUrls = @(
  @{
    name = "PostgreSQL Official"
    url = "https://www.postgresql.org/ftp/binary/v18.0/win64/postgresql-18.0-1-windows-x64.exe"
  },
  @{
    name = "PostgreSQL Alt"
    url = "https://get.postgresql.org/postgresql/18.0/postgresql-18.0-1-windows-x64.exe"
  },
  @{
    name = "EnterpriseDB"
    url = "https://sbp.enterprisedb.com/getfile.jsp?fileid=1262139"
  }
)

$installerPath = $null
foreach ($source in $downloadUrls) {
  Write-Host "Trying: $($source.name)..." -NoNewline

  try {
    $out = "$env:TEMP\postgresql-installer.exe"
    Invoke-WebRequest -Uri $source.url -OutFile $out -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    
    # Verify it's a valid exe
    $bytes = @(Get-Content -Path $out -Encoding Byte -TotalCount 2 -ErrorAction SilentlyContinue)
    if ($bytes[0] -eq 0x4D -and $bytes[1] -eq 0x5A) {  # MZ header
      Write-Host " ✓" -ForegroundColor Green
      $installerPath = $out
      break
    } else {
      Write-Host " ✗ (invalid file)" -ForegroundColor Red
      Remove-Item $out -Force -ErrorAction SilentlyContinue
    }
  } catch {
    Write-Host " ✗" -ForegroundColor Red
  }
}

if ($installerPath) {
  Write-Host ""
  Write-Host "Running PostgreSQL installer..." -ForegroundColor Yellow
  
  try {
    & $installerPath `
      --mode unattended `
      --unattendedmodeui minimal `
      --superpassword $SuperPassword `
      --servicename "postgresql" `
      --servicepassword $SuperPassword `
      --serverport $Port `
      --prefix $InstallPath `
      --enable-stackbuilder 0 `
      | Out-Null
    
    Start-Sleep -Seconds 3
    
    if (Test-PortListening -Port $Port) {
      Write-Host "✓ PostgreSQL installed and running on port $Port" -ForegroundColor Green
      Write-Host ""
      Write-Host "Connection details:" -ForegroundColor Green
      Write-Host "  Host: localhost"
      Write-Host "  Port: $Port"
      Write-Host "  User: postgres"
      Write-Host "  Password: $SuperPassword"
      exit 0
    } else {
      Write-Host "⚠ Installer completed but port not responding" -ForegroundColor Yellow
      exit 1
    }
  } catch {
    Write-Host "✗ Installer failed: $_" -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host ""
  Write-Host "✗ Could not download PostgreSQL installer" -ForegroundColor Red
  Write-Host ""
  Write-Host "Manual Installation Instructions:" -ForegroundColor Cyan
  Write-Host "======================================" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "1. Visit: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
  Write-Host "2. Download PostgreSQL 18 (or 17) Windows installer"
  Write-Host "3. Run the installer with these settings:" -ForegroundColor Yellow
  Write-Host "   - Port: 5432"
  Write-Host "   - Username: postgres"
  Write-Host "   - Password: $SuperPassword"
  Write-Host ""
  Write-Host "4. After installation, run your app launcher:"
  Write-Host "   pnpm run windows:run" -ForegroundColor Cyan
  Write-Host ""
  exit 1
}
