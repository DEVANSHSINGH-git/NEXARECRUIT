# 🏗️ NexaRecruit System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 14)                      │
│                    Port: 3000 | TypeScript                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Candidate Dashboard | Recruiter Dashboard | Auth Pages  │   │
│  │ Real-time Resume Upload | AI Evaluations Display        │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP + JWT Token (Supabase Auth)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│               Backend API Gateway (Express.js)                   │
│             Port: 5000 | Node.js 20 + TypeScript               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ /api/auth        → Supabase Auth integration            │   │
│  │ /api/candidate   → Resume & recommendations             │   │
│  │ /api/evaluations → AI evaluation requests                │   │
│  │ /api/recruiter   → Candidate list, shortlisting         │   │
│  │ /api/upload      → Resume file processing                │   │
│  │ /api/health      → System health check                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP + Auth Headers
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│             AI Service (FastAPI + Python 3.11)                   │
│                    Port: 8000 | Async                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ /api/parse-resume       → Extract resume text (PDF/DOCX) │   │
│  │ /api/evaluate           → 6-agent AI evaluation pipeline │   │
│  │ /api/recommendations    → Career guidance generation     │   │
│  │ /api/health             → Service status check           │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ SQL + Async
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│    Supabase PostgreSQL (Cloud) + pgvector Extension              │
│            Database: db.<your-project-id>.supabase.co             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Users Table         → Auth + profiles                     │   │
│  │ Resumes Table       → Parsed resume data                  │   │
│  │ Evaluations Table   → AI scores & feedback                │   │
│  │ Recommendations     → Career guidance data                │   │
│  │ Job Descriptions    → JD storage                          │   │
│  │ Embeddings Table    → Vector search (pgvector)            │   │
│  │ RecruiterActions    → Shortlist & notes                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  Features: RLS policies, Realtime subscriptions, Full backups   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Optional Cache Layer
                       ▼
                  ┌─────────────┐
                  │  Redis 7    │
                  │ Port: 6379  │
                  │  (Optional) │
                  └─────────────┘
                       ▲
                       │ Groq API (External)
                       │ https://api.groq.com/v1
                       │ Model: llama-3.3-70b-versatile
```

## Component Details

### 1. **Frontend** (Next.js 14 + React 18 + Tailwind)
**Location:** `/frontend`

- **Tech Stack**
  - TypeScript 5.4
  - Tailwind CSS 3.4
  - React Hot Toast (notifications)
  - Lucide Icons (UI elements)
  - Zustand (state management)

- **Pages**
  - `/login` - Authentication
  - `/register` - User registration
  - `/candidate/dashboard` - Resume upload & history
  - `/candidate/evaluations` - AI evaluation results
  - `/candidate/recommendations` - Career guidance
  - `/recruiter/dashboard` - Candidate analytics
  - `/recruiter/candidates` - Candidate browse & filter
  - `/recruiter/shortlisted` - Shortlist management

- **Authentication**
  - Uses Supabase Auth (managed by backend)
  - JWT tokens stored in Supabase session
  - Auto-refresh token via axios interceptor

### 2. **Backend API** (Express.js + Prisma)
**Location:** `/backend`

- **Tech Stack**
  - Node.js 20 LTS
  - Express.js 4.19
  - Prisma ORM 5.14 (PostgreSQL)
  - TypeScript 5.4
  - Zod (validation)
  - Multer (file upload)

- **Architecture**
  - **Middleware Layer**
    - `auth.ts` - JWT verification with Supabase
    - `validate.ts` - Zod schema validation
    - `errorHandler.ts` - Centralized error handling
    - `corsHandler.ts` - CORS configuration

  - **Routes**
    - `auth.routes.ts` - Registration, login, refresh
    - `candidate.routes.ts` - Resume upload, recommendations
    - `recruiter.routes.ts` - Dashboard, candidate list, shortlist
    - `evaluation.routes.ts` - AI evaluation trigger & results
    - `upload.routes.ts` - File upload & parsing
    - `health.routes.ts` - System health check

  - **Config**
    - `database.ts` - Prisma client
    - `redis.ts` - Optional cache (graceful fallback)
    - `supabase.ts` - Supabase Admin client (service role)

- **Features**
  - ✓ Async middleware (non-blocking)
  - ✓ Redis caching (optional, won't crash if unavailable)
  - ✓ File upload to `/uploads` directory
  - ✓ Supabase RLS enforcement
  - ✓ Structured error responses

### 3. **AI Service** (FastAPI + 6-Agent Pipeline)
**Location:** `/ai-services`

- **Tech Stack**
  - Python 3.11+
  - FastAPI 0.111
  - Uvicorn (async ASGI)
  - Groq API (OpenAI-compatible)
  - sentence-transformers (local embeddings)
  - PyPDF2 + python-docx (parsing)
  - SQLAlchemy ORM
  - Redis (optional cache)

- **Evaluation Pipeline** (6 Sequential Agents)
  ```
  Resume → JD → Semantic Match → Scoring → Feedback → Recommendations
  ```

  1. **Resume Agent** (`resume_agent.py`)
     - Parses resume using Groq
     - Extracts: skills, experience, projects, certifications
     - Validates completeness

  2. **JD Agent** (`jd_agent.py`)
     - Analyzes job description
     - Extracts requirements, nice-to-haves, domain
     - Identifies key keywords

  3. **Matching Agent** (`matching_agent.py`)
     - Uses local embeddings (all-MiniLM-L6-v2)
     - Creates vector embeddings (384 dimensions)
     - Computes semantic similarity with pgvector

  4. **Scoring Agent** (`scoring_agent.py`)
     - Weighted scoring formula:
       - Skills Match: 40%
       - Experience: 25%
       - Projects: 15%
       - Domain Alignment: 10%
       - Resume Quality: 10%
     - Final ATS score: 0-100

  5. **Feedback Agent** (`feedback_agent.py`)
     - Generates strengths list
     - Identifies weaknesses
     - Lists missing skills
     - Provides improvement suggestions

  6. **Career Agent** (`career_agent.py`)
     - Recommends related roles
     - Generates skill-up roadmap
     - Suggests learning paths
     - Identifies skill gaps

- **Features**
  - ✓ Async/await throughout
  - ✓ Structured logging (structlog)
  - ✓ Local embeddings (no external API for matching)
  - ✓ Groq API for text processing
  - ✓ Error recovery with fallback scores
  - ✓ Result caching in PostgreSQL
  - ✓ Redis optional cache layer

### 4. **Database** (Supabase PostgreSQL + pgvector)
**Location:** `/database`

- **Tables**
  ```sql
  users              → Authentication + profiles
  resumes            → Parsed resume content + metadata
  job_descriptions   → Job postings + requirements
  evaluations        → Scores, feedback, weaknesses
  recommendations    → Career roadmap + skill suggestions
  embeddings         → Vector search (pgvector extension)
  recruiter_actions  → Shortlist history + notes
  ```

- **Indexes** (Performance Optimized)
  - User ID indexes (common filters)
  - Resume ID foreign key indexes
  - Created timestamp indexes (sorting)
  - Job description ID indexes

- **RLS Policies** (Row-Level Security)
  - Users can only see their own resumes
  - Recruiters can only see candidates they interacted with
  - Service role bypasses RLS (backend operations)

- **Triggers**
  - Auto-update `updated_at` on modification
  - Vector embedding updates on new evaluations

### 5. **Cache Layer** (Redis - Optional)
**Features**
- ✓ Dashboard caching (30 min TTL)
- ✓ Recommendation caching
- ✓ Graceful fallback if unavailable
- ✓ Auto-invalidation on new evaluations

## Data Flow

### User Registration
```
User → Frontend (/register)
  → Backend (/api/auth/register)
    → Supabase Auth (create user)
    → PostgreSQL (create profile)
    → Return auth token
  → Frontend (redirect to dashboard)
```

### Resume Evaluation
```
User → Upload Resume
  → Backend (/api/upload/resume)
    → Multer (parse file)
    → PyPDF2/docx (extract text)
    → Store in PostgreSQL (resumes table)
  → Frontend (show success)

User → Create Evaluation
  → Backend (/api/evaluations)
    → AI Service (/api/evaluate)
      → 6-agent pipeline (Groq LLM)
      → Vector embeddings (local model)
      → Semantic matching
      → Generate scores
    → Store in PostgreSQL (evaluations table)
    → Update embeddings table
    → Cache result (Redis if available)
  → Frontend (display results)
```

### Recruiter Shortlist
```
Recruiter → View Candidates (/api/recruiter/candidates)
  → Backend (query + pagination)
    → PostgreSQL (fetch evaluations)
    → Cache if available
  → Display candidates with ATS scores

Recruiter → Shortlist Candidate
  → Backend (POST /api/recruiter/shortlist)
    → Create RecruiterAction record
    → Update cache
  → Frontend (add to shortlist)
```

## Authentication Flow

```
User Credentials → Supabase Auth (Provider)
  ↓
Returns: Auth Token + Refresh Token
  ↓
Frontend stores in Supabase session
  ↓
Frontend sends: Authorization: Bearer {token}
  ↓
Backend verifies with Supabase.auth.getUser(token)
  ↓
Backend looks up user in PostgreSQL
  ↓
Continues request (or returns 401)
```

## Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| Frontend | Toast notifications + user-friendly messages |
| Backend | Zod validation → structured errors → HTTP status |
| AI Service | Fallback scoring if Groq fails |
| Database | Transactions for consistency |
| Cache | Graceful miss → fetch from DB |

## Performance Optimizations

1. **Database**
   - Indexes on frequently queried columns
   - Pagination (max 50 items/page)
   - Lazy loading of relationships
   - pgvector for semantic search

2. **Backend**
   - Response caching (Redis)
   - Connection pooling (Prisma)
   - Async middleware
   - Request validation (prevent bad data)

3. **Frontend**
   - Image optimization (Next.js)
   - Code splitting (dynamic imports)
   - Tailwind CSS purging
   - React component memoization

4. **AI Service**
   - Local embeddings (no network latency)
   - Batch processing ready
   - Result caching in DB
   - Async processing

## Security

1. **Authentication**
   - Supabase managed (OAuth ready)
   - JWT validation on backend
   - Service role key for admin operations

2. **Database**
   - Row-level security (RLS)
   - Parameterized queries (Prisma)
   - HTTPS only (Supabase)
   - Regular backups

3. **API**
   - CORS whitelist
   - Rate limiting (production)
   - Input validation (Zod)
   - Error message sanitization

4. **File Upload**
   - 10MB limit
   - Whitelist: PDF, DOCX only
   - Virus scanning (optional)
   - Stored in `/uploads` (isolated)

---
See [Database Schema](./DATABASE.md) for detailed table structures.
