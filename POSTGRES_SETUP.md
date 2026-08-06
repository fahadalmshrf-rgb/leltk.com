# PostgreSQL Setup for Windows

## Current Status

Your monorepo project is fully configured and ready to run, but requires a PostgreSQL database to start. Automated installation has encountered blockers due to:

- Network security policies blocking direct executable downloads from PostgreSQL mirrors
- No system package managers (winget/choco/scoop) available on this machine
- WSL2 not installed

## Solution Options

### ✅ Option 1: Manual PostgreSQL Installation (Recommended)

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Download: PostgreSQL 18 (or 17) Windows Installer (x64)

2. **Run Installer**
   - Port: `5432`
   - Username: `postgres`
   - Password: `P@ssw0rd123!`
   - Administration Database: Leave default
   - Uncheck "Stack Builder" (not needed)

3. **Verify Installation**
   - PostgreSQL service should auto-start
   - Port 5432 should be listening
   - Test: `psql -U postgres` in PowerShell

4. **Launch Your App**
   ```PowerShell
   $env:DATABASE_URL = "postgresql://postgres:P@ssw0rd123!@localhost:5432/lailtak"
   $env:SESSION_SECRET = "your-secret-key-here"
   pnpm run windows:run
   ```

### ✅ Option 2: Use Cloud PostgreSQL (Quick Testing)

Free PostgreSQL hosting options:
- **Render** (https://render.com) - Free tier includes PostgreSQL
- **Railway** (https://railway.app) - $5/month PostgreSQL
- **ElephantSQL** (https://www.elephantsql.com) - Free tier available

After creating account:
```PowerShell
$env:DATABASE_URL = "postgresql://user:password@hostname:5432/dbname"
$env:SESSION_SECRET = "your-secret-key-here"
pnpm run windows:run
```

### ✅ Option 3: Docker Desktop (If Installable)

If you can later install Docker Desktop:
```PowerShell
docker run -d `
  -e POSTGRES_PASSWORD=P@ssw0rd123! `
  -e POSTGRES_DB=lailtak `
  -p 5432:5432 `
  postgres:18

$env:DATABASE_URL = "postgresql://postgres:P@ssw0rd123!@localhost:5432/lailtak"
$env:SESSION_SECRET = "your-secret-key"
pnpm run windows:run
```

## Verification Checklist

- [ ] PostgreSQL installer downloaded and run
- [ ] Port 5432 listening: `Test-NetConnection localhost -Port 5432`
- [ ] psql works: `psql -U postgres -c "SELECT 1"`
- [ ] Environment variables set in PowerShell before running launcher
- [ ] App launches successfully: `pnpm run windows:run`

## Environment Variables Required

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://postgres:P@ssw0rd123!@localhost:5432/lailtak` | Full connection string |
| `SESSION_SECRET` | `dev-secret-key-here` | Any random string for session signing |

## Next Steps

1. Choose one of the above options
2. Install/configure PostgreSQL
3. Set environment variables in PowerShell
4. Run: `pnpm run windows:run`

The app will automatically:
- Install workspace dependencies
- Build all web apps
- Create database schema (Drizzle ORM)
- Start the API server on port 8080

## Troubleshooting

**"DATABASE_URL is required" error**
```PowerShell
# Set environment variables BEFORE running
$env:DATABASE_URL = "postgresql://..."
$env:SESSION_SECRET = "..."
```

**"Connection refused" error**
- Verify PostgreSQL is running: `Get-Service postgresql | Select Status`
- Start service if stopped: `Start-Service -Name postgresql`
- Check port listening: `netstat -an | findstr :5432`

**"psql not found"**
- Verify PostgreSQL installation at: `C:\Program Files\PostgreSQL\18\bin\psql.exe`
- Add to PATH if missing

## Project Structure Ready

✅ Node.js v24.18.1 - installed
✅ pnpm v11.18.0 - activated
✅ Windows launcher - configured at `scripts/windows-run.ps1`
✅ Build pipeline - all packages ready
✅ Database schema - ready to apply via Drizzle

**Only missing:** PostgreSQL database server

Once PostgreSQL is running, everything else works automatically.
