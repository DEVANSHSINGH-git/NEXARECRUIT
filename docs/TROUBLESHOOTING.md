# 🐛 Troubleshooting Guide

## Common Issues & Solutions

### Node.js Installation

**Problem:** `node: command not found`

**Solution:**
1. Download Node.js 20 LTS from https://nodejs.org
2. Run installer (node-v20.x.x-x64.msi)
3. Accept all defaults
4. Restart terminal
5. Verify: `node --version` & `npm --version`

---

### Python Installation

**Problem:** `python: command not found` or `python3: command not found`

**Solution:**
1. Download Python 3.11+ from https://python.org
2. Run installer
3. **IMPORTANT**: Check "Add Python to PATH"
4. Restart terminal
5. Verify: `python --version`

---

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE :::3000`

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID 12345 /F

# OR use different port
# In frontend/package.json, change:
# "dev": "next dev -p 3001"
```

---

### Database Connection Issues

**Problem:** `Error: FATAL: password authentication failed`

**Solution:**
1. Verify `DATABASE_URL` in `.env`:
   ```
   postgresql://user:password@db.supabase.co:5432/postgres
   ```
2. Check credentials in Supabase Console
3. Ensure database is accessible from your location
4. Test connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

---

### Supabase Auth Issues

**Problem:** `Error: Supabase auth failed`

**Solution:**
1. Check `SUPABASE_URL` format: `https://xxxx.supabase.co`
2. Check `SUPABASE_ANON_KEY` length (should be ~100+ chars)
3. Verify in Supabase Project Settings
4. Test:
   ```bash
   curl https://xxxx.supabase.co/rest/v1/ \
     -H "apikey: $SUPABASE_ANON_KEY"
   ```

---

### Groq API Issues

**Problem:** `Error: Invalid API key` or `401 Unauthorized`

**Solution:**
1. Get API key from https://console.groq.com
2. Verify key in `ai-services/.env`:
   ```
   GROQ_API_KEY=gsk_xxx...
   ```
3. Check key has not expired
4. Test:
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer $GROQ_API_KEY"
   ```

---

### Redis Connection Issues

**Problem:** ⚠ Redis not available (but app still works)

**Solution:**
- Redis is optional - app works without it
- To enable Redis:
  1. Install Redis from https://redis.io
  2. Start Redis: `redis-server`
  3. Set `REDIS_URL` in `.env`:
     ```
     REDIS_URL=redis://localhost:6379
     ```

---

### npm Install Issues

**Problem:** `npm ERR! code E403 Forbidden`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Install with legacy peer deps
npm install --legacy-peer-deps

# Try again
npm install
```

**Problem:** `npm ERR! ERESOLVE unable to resolve dependency tree`

**Solution:**
```bash
# Use --force flag
npm install --force

# OR use npm 8+
npm install --legacy-peer-deps
```

---

### Prisma Issues

**Problem:** `Error: ENOENT: no such file or directory, open '@prisma/client'`

**Solution:**
```bash
cd backend

# Regenerate Prisma client
npx prisma generate

# Clear node_modules
rm -r node_modules
npm install

# Try again
npm run dev
```

---

### Frontend Build Issues

**Problem:** `ReferenceError: window is not defined`

**Solution:**
This happens when using browser APIs during server-side rendering. Fix:
```typescript
// ❌ Wrong
import { localStorage } from 'window';

// ✓ Correct
if (typeof window !== 'undefined') {
  localStorage.setItem('key', 'value');
}

// ✓ Or use useEffect
useEffect(() => {
  localStorage.setItem('key', 'value');
}, []);
```

---

### AI Service Errors

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd ai-services

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; print(fastapi.__version__)"
```

**Problem:** `Connection refused` when calling AI service

**Solution:**
1. Verify AI service is running:
   ```bash
   curl http://localhost:8000/api/health
   ```
2. Check port (default 8000):
   ```bash
   netstat -ano | findstr :8000
   ```
3. Verify `AI_SERVICE_URL` in backend `.env`:
   ```
   AI_SERVICE_URL=http://localhost:8000
   ```

---

### Authentication Issues

**Problem:** `401 Unauthorized` on protected endpoints

**Solution:**
1. Check token is being sent:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/candidate/resumes
   ```
2. Verify token is valid (not expired)
3. Token should be from Supabase auth response
4. Check in frontend that token is included in axios interceptor

**Problem:** `Session expired` message

**Solution:**
1. Log out and log back in
2. Check `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Verify Supabase project settings
4. Check browser console for error details

---

### Resume Upload Issues

**Problem:** `Error: File too large`

**Solution:**
- Maximum file size: 10 MB
- Compress PDF/DOCX before uploading
- Check file was fully selected

**Problem:** `Error: Invalid file format`

**Solution:**
- Only PDF and DOCX supported
- Ensure file extension matches content
- Verify file is not corrupted

---

### API Response Issues

**Problem:** `Error: CORS error` in browser console

**Solution:**
1. Check `CORS_ORIGIN` in backend `.env`:
   ```
   CORS_ORIGIN=http://localhost:3000
   ```
2. For production, set to your domain:
   ```
   CORS_ORIGIN=https://yourdomain.com
   ```
3. Restart backend
4. Test:
   ```bash
   curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     http://localhost:5000/api/health
   ```

**Problem:** `Error: 500 Internal Server Error`

**Solution:**
1. Check backend logs:
   ```bash
   npm run dev  # Look for error message
   ```
2. Verify all environment variables are set
3. Check database connection
4. Verify AI service is running
5. Check Groq API key is valid

---

### Performance Issues

**Problem:** Slow API responses (> 5 seconds)

**Solution:**
1. Check database query performance:
   ```bash
   # In Supabase, check query stats
   SELECT query, mean_time, stddev_time FROM pg_stat_statements
   ORDER BY mean_time DESC LIMIT 10;
   ```
2. Add indexes if needed
3. Enable Redis caching
4. Check AI service response time:
   ```bash
   time curl http://localhost:8000/api/health
   ```

**Problem:** Frontend slow on first load

**Solution:**
1. Check Next.js build time:
   ```bash
   npm run build  # Check console output
   ```
2. Enable Next.js image optimization
3. Code split components dynamically:
   ```typescript
   const HeavyComponent = dynamic(() => import('./Heavy'), {
     loading: () => <Skeleton />
   });
   ```

---

### Database Issues

**Problem:** `Error: relation "users" does not exist`

**Solution:**
1. Verify migration has been run:
   - Go to Supabase SQL Editor
   - Check if tables exist
   - Run migration from `database/supabase_migration.sql`

2. Test connection:
   ```bash
   psql $DATABASE_URL -c "\dt"  # List tables
   ```

**Problem:** Permission denied errors

**Solution:**
1. Verify RLS policies are set correctly
2. Check user role matches policy
3. For service role operations, ensure using:
   ```typescript
   const supabaseAdmin = createClient(url, SERVICE_ROLE_KEY);
   ```

---

### Docker Issues

**Problem:** `docker: command not found`

**Solution:**
1. Install Docker Desktop from https://docker.com
2. Restart computer
3. Verify: `docker --version`

**Problem:** `Error: ports are already allocated`

**Solution:**
```bash
# Stop conflicting container
docker-compose down

# OR use different ports
docker-compose -f docker-compose.yml -p myproject up
```

---

### Script Execution Issues

**Problem:** `PowerShell: cannot be loaded because running scripts is disabled`

**Solution:**
```powershell
# Allow script execution (one-time)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run setup script
.\setup.ps1
```

---

### General Debugging

**Enable Verbose Logging:**

Backend:
```typescript
// In src/utils/logger.ts
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',  // Set to 'debug'
  // ...
});
```

AI Service:
```bash
# Set in .env
LOG_LEVEL=debug

# Run with debug
python -u app/main.py --log-level debug
```

Frontend:
```typescript
// In .env.local
NEXT_PUBLIC_DEBUG=true

// Use in code
if (process.env.NEXT_PUBLIC_DEBUG) {
  console.log('Debug info:', data);
}
```

---

### Getting Help

1. **Check logs:**
   - Backend: `npm run dev` (console output)
   - Frontend: Browser console (F12)
   - AI Service: Terminal output

2. **Verify environment:**
   - All `.env` files present
   - All keys valid
   - All services running

3. **Test endpoints:**
   ```bash
   curl http://localhost:5000/api/health
   curl http://localhost:8000/api/health
   curl http://localhost:3000
   ```

4. **Reset everything:**
   ```bash
   # Clear all and reinstall
   .\setup.ps1
   ```

---

## Health Check Commands

Run these to verify system health:

```powershell
# Check Node.js
node --version
npm --version

# Check Python
python --version

# Check database
$env:DATABASE_URL = "..."
psql $env:DATABASE_URL -c "SELECT 1;"

# Check Supabase
$env:SUPABASE_URL = "..."
$env:SUPABASE_ANON_KEY = "..."
curl -H "apikey: $env:SUPABASE_ANON_KEY" "$env:SUPABASE_URL/rest/v1/"

# Check Groq
curl -H "Authorization: Bearer $env:GROQ_API_KEY" \
  https://api.groq.com/openai/v1/models

# Check Redis (if enabled)
redis-cli ping

# Test all services
.\startup.ps1
# Then in another terminal:
curl http://localhost:5000/api/health
curl http://localhost:8000/api/health
curl http://localhost:3000
```

---

Still stuck? Check:
- Browser Developer Console (F12)
- Server logs (check terminal output)
- Supabase Dashboard (check database/auth status)
- Groq Console (check API key and usage)
