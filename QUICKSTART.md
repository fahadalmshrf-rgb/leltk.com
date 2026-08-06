# Quick Start Guide - Lailtak Monorepo

## ✅ What's Ready

Your development environment is fully configured:

- **Node.js:** v24.18.1 LTS ✓
- **pnpm:** v11.18.0 ✓  
- **Windows Launcher:** `scripts/windows-run.ps1` ✓
- **Build Pipeline:** All workspace packages ready ✓
- **API Framework:** Express 5 with TypeScript ✓
- **Frontend Frameworks:** React (Vite) + Expo Ready ✓

## ⏳ One Step Remaining: PostgreSQL

The application requires a PostgreSQL database. Choose your setup method:

### 🚀 Fastest Option: Manual Installation (5-10 minutes)

1. Download PostgreSQL 18 from: https://www.postgresql.org/download/windows/
2. Run installer with default settings except:
   - **Password:** `P@ssw0rd123!` (or your preferred password)
   - **Port:** `5432` (keep default)
3. After installation completes, run in PowerShell:

```powershell
$env:DATABASE_URL = "postgresql://postgres:P@ssw0rd123!@localhost:5432/lailtak"
$env:SESSION_SECRET = "my-dev-secret-key"
pnpm run windows:run
```

That's it! The app will:
- Install all dependencies
- Build all web apps
- Create database schema automatically
- Start the API server on port 8080

### 💻 Alternative: Cloud Database (No Installation)

Use free PostgreSQL hosting for quick testing:

```powershell
# Get connection string from Render/Railway/ElephantSQL
$env:DATABASE_URL = "postgresql://user:pass@hostname:5432/dbname"
$env:SESSION_SECRET = "my-secret"
pnpm run windows:run
```

Recommended services:
- **Render** - https://render.com (free tier)
- **Railway** - https://railway.app ($5/month)

### 🐳 Advanced: Docker (If Available)

```powershell
docker run -d -e POSTGRES_PASSWORD=P@ssw0rd123! -e POSTGRES_DB=lailtak -p 5432:5432 postgres:18

$env:DATABASE_URL = "postgresql://postgres:P@ssw0rd123!@localhost:5432/lailtak"
$env:SESSION_SECRET = "dev-secret"
pnpm run windows:run
```

## 📖 Full Documentation

- **PostgreSQL Setup Details:** `./POSTGRES_SETUP.md`
- **Project Structure:** `./pnpm-workspace.yaml`
- **API Documentation:** `./artifacts/api-server/`
- **Threat Model:** `./threat_model.md`

## 🎯 What Happens When You Run `pnpm run windows:run`

```
✓ Check Node.js and pnpm
✓ Validate DATABASE_URL and SESSION_SECRET  
✓ Install workspace dependencies (pnpm install)
✓ Build user web app (@workspace/lailtak)
✓ Build merchant portal (@workspace/lailtak-merchant)
✓ Build admin dashboard (@workspace/lailtak-admin)
✓ Build API server (@workspace/api-server)
✓ Initialize database schema (Drizzle ORM)
✓ Start API server on port 8080
```

Then access:
- **API:** http://localhost:8080
- **User App:** http://localhost:8080 (served by app)
- **Docs:** See `./POSTGRES_SETUP.md`

## 🔧 Help & Troubleshooting

**"DATABASE_URL is required" error**
- You haven't set the environment variable
- See quickstart above - set DATABASE_URL before running launcher

**"Connection refused" error**
- PostgreSQL isn't running or listening on port 5432
- Windows: Check `Services` → PostgreSQL service status, start if needed
- Terminal: `Get-Service postgresql | Start-Service`

**"psql not found" in terminal**
- PostgreSQL isn't in PATH
- Add: `C:\Program Files\PostgreSQL\18\bin` to Windows PATH
- Or use full path: `C:\Program Files\PostgreSQL\18\bin\psql.exe -U postgres`

**Need to change database credentials**
- Edit your DATABASE_URL environment variable
- Format: `postgresql://user:password@host:port/database`

## 📝 Environment Variables

These must be set before running `pnpm run windows:run`:

```powershell
# Connection to PostgreSQL database
$env:DATABASE_URL = "postgresql://postgres:PASSWORD@localhost:5432/lailtak"

# Secret key for session cookies (any random string)
$env:SESSION_SECRET = "any-random-string-for-sessions"

# Optional: Change default port (normally 8080)
$env:PORT = "3000"
```

## 🚀 Next Steps

1. Choose PostgreSQL setup method (manual / cloud / docker)
2. Get PostgreSQL running
3. Set environment variables in PowerShell  
4. Run: `pnpm run windows:run`
5. Access app at: http://localhost:8080

**Need detailed help?** → See `./POSTGRES_SETUP.md`

---

**Infrastructure Summary:**
- ✅ Node.js, pnpm, TypeScript configured
- ✅ Windows launcher script created and tested
- ✅ Build pipeline connected (Express API + 3x React apps + Expo)
- ⏳ PostgreSQL database (manual setup required)
- ✅ Ready to develop!
