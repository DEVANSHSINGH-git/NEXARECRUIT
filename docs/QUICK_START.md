# 🚀 NexaRecruit - Quick Start Guide

Get started with NexaRecruit in 5 minutes!

## Prerequisites
- **Node.js** v20+ LTS
- **Python** 3.11+
- **Supabase** account with a project created
- **Groq** API key (free tier available)

## Step 1: Clone & Install Dependencies (3 min)

From the project root, run:
```powershell
.\setup.ps1
```

This will:
- ✓ Install Node.js dependencies (backend + frontend)
- ✓ Generate Prisma client
- ✓ Install Python AI service dependencies
- ✓ Verify all environment files

## Step 2: Set Up Database (2 min)

1. Open [Supabase Console](https://app.supabase.com)
2. Select your NexaRecruit project
3. Go to **SQL Editor** → **New Query**
4. Copy contents from `database/supabase_migration.sql`
5. Paste into the editor and click **Run**

✓ Database is now ready!

## Step 3: Start Services (Works in One Terminal!)

### Option A: Automatic (Recommended)
```powershell
.\startup.ps1
```

### Option B: Manual (3 separate terminals)
```powershell
# Terminal 1: AI Service
cd ai-services
uvicorn app.main:app --reload --port 8000

# Terminal 2: Backend API
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

## Step 4: Access the App

| Service | URL | Purpose |
|---------|-----|---------|
| 🎨 Frontend | http://localhost:3000 | User interface |
| 🔌 Backend API | http://localhost:5000 | API endpoints |
| 🤖 AI Service | http://localhost:8000 | AI evaluation |

## Test the App

1. **Register**: Sign up with any email (auto-confirmed in dev)
2. **Upload Resume**: Drag & drop a PDF/DOCX
3. **Create Evaluation**: Paste a job description
4. **View Results**: AI evaluation in real-time

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `node: command not found` | Install Node.js 20 LTS from https://nodejs.org |
| `python: command not found` | Install Python 3.11+ from https://python.org |
| Port 3000 already in use | Change in `frontend/package.json` → `PORT=3001 npm run dev` |
| Supabase connection fails | Check `DATABASE_URL` in `.env` |
| AI service errors | Verify `GROQ_API_KEY` is valid in `ai-services/.env` |

## Environment Variables

All required variables are in `.env` (already configured):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key
- `GROQ_API_KEY` - AI model API key
- `DATABASE_URL` - PostgreSQL connection string

## Next Steps

- 📖 See [Architecture](./ARCHITECTURE.md) for system design
- 🔌 See [API Documentation](./API.md) for endpoints
- 🚢 See [Deployment](./DEPLOYMENT.md) for production setup
- 🐛 See [Troubleshooting](./TROUBLESHOOTING.md) for common issues

---
**Ready?** Run `.\startup.ps1` to launch all services! 🎉
