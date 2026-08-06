param(
  [string]$DatabaseUrl,
  [string]$SessionSecret,
  [int]$Port = 8080,
  [switch]$SkipInstall,
  [switch]$SkipBuild,
  [switch]$SkipUserBuild,
  [switch]$SkipMerchantBuild,
  [switch]$SkipAdminBuild
)

$ErrorActionPreference = "Stop"

function Assert-Command {
  param([Parameter(Mandatory = $true)][string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found. Install it and try again."
  }
}

function Run-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][string]$Command
  )

  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Cyan
  Write-Host "    $Command" -ForegroundColor DarkGray
  Invoke-Expression $Command
}

Assert-Command -Name "pnpm"
Assert-Command -Name "node"

if (-not $DatabaseUrl) {
  $DatabaseUrl = $env:DATABASE_URL
}
if (-not $SessionSecret) {
  $SessionSecret = $env:SESSION_SECRET
}

if (-not $DatabaseUrl) {
  Write-Host ""
  Write-Host "ERROR: DATABASE_URL not configured" -ForegroundColor Red
  Write-Host ""
  Write-Host "PostgreSQL is required. For setup instructions, see:" -ForegroundColor Yellow
  Write-Host "  ./POSTGRES_SETUP.md" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Quick start (if PostgreSQL is installed):" -ForegroundColor Green
  Write-Host "  `$env:DATABASE_URL = 'postgresql://postgres:P@ssw0rd123!@localhost:5432/lailtak'" -ForegroundColor Gray
  Write-Host "  `$env:SESSION_SECRET = 'dev-secret-key'" -ForegroundColor Gray
  Write-Host ""
  throw "DATABASE_URL is required. See POSTGRES_SETUP.md"
}
if (-not $SessionSecret) {
  throw "SESSION_SECRET is required. Set `$env:SESSION_SECRET environment variable."
}

$env:PORT = "$Port"
$env:DATABASE_URL = $DatabaseUrl
$env:SESSION_SECRET = $SessionSecret

Write-Host ""
Write-Host "Windows run configuration" -ForegroundColor Green
Write-Host "  PORT=$($env:PORT)"
Write-Host "  DATABASE_URL is set"
Write-Host "  SESSION_SECRET is set"

if (-not $SkipInstall) {
  Run-Step -Title "Install workspace dependencies" -Command "pnpm install"
}

if (-not $SkipBuild) {
  if (-not $SkipUserBuild) {
    Run-Step -Title "Build user web app" -Command "pnpm --filter @workspace/lailtak run build"
  }
  if (-not $SkipMerchantBuild) {
    Run-Step -Title "Build merchant web app" -Command "pnpm --filter @workspace/lailtak-merchant run build"
  }
  if (-not $SkipAdminBuild) {
    Run-Step -Title "Build admin web app" -Command "pnpm --filter @workspace/lailtak-admin run build"
  }

  Run-Step -Title "Build API server" -Command "pnpm --filter @workspace/api-server run build"
}

Run-Step -Title "Start API server" -Command "pnpm --filter @workspace/api-server run start"
