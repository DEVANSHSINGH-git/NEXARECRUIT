# 🗄️ Database Schema & Migrations

## Database Overview

**Type:** PostgreSQL (Supabase)  
**URL:** `db.<your-project-id>.supabase.co`  
**Extensions:** pgvector (for vector embeddings)  
**Access:** Via Prisma ORM (backend) or direct SQL (Supabase)

## Tables

### 1. **users** (Authentication + Profiles)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,                    -- Supabase Auth UID
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM ('CANDIDATE', 'RECRUITER'),
  profile_image_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Prisma Model:**
```typescript
model User {
  id        String    @id
  email     String    @unique
  name      String
  role      Role      // CANDIDATE | RECRUITER
  profileImageUrl String?
  bio       String?
  location  String?
  phone     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  resumes         Resume[]
  evaluations     Evaluation[] @relation("UserEvaluations")
  jobDescriptions JobDescription[]
  recommendations Recommendation[]
  recruiterActions RecruiterAction[]
}
```

---

### 2. **resumes** (Uploaded Resume Data)

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT,
  file_size INT,
  mime_type VARCHAR(50),
  parsed_content TEXT,                    -- Full resume text
  skills JSON,                             -- Extracted: ["Python", "React"]
  experience_years INT,
  certifications JSON,                     -- Extracted: [...]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);
```

**Prisma Model:**
```typescript
model Resume {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  fileName      String   @map("file_name")
  filePath      String?  @map("file_path")
  fileSize      Int?     @map("file_size")
  mimeType      String?  @map("mime_type")
  parsedContent String?  @map("parsed_content")
  skills        Json?
  experienceYears Int?   @map("experience_years")
  certifications Json?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  evaluations   Evaluation[]
}
```

---

### 3. **job_descriptions** (Job Postings)

```sql
CREATE TABLE job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                  -- Recruiter who posted
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,                  -- Full JD text
  requirements JSON,                      -- Extracted: ["3+ years", "Node.js"]
  nice_to_have JSON,
  domain VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_job_descriptions_user_id ON job_descriptions(user_id);
CREATE INDEX idx_job_descriptions_domain ON job_descriptions(domain);
```

**Prisma Model:**
```typescript
model JobDescription {
  id       String   @id @default(uuid())
  userId   String   @map("user_id")
  title    String
  content  String   @db.Text
  requirements Json?
  niceToHave Json? @map("nice_to_have")
  domain   String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  evaluations Evaluation[]
}
```

---

### 4. **evaluations** (AI Evaluation Results)

```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL,
  job_description_id UUID NOT NULL,
  ats_score FLOAT,                        -- 0-100: Final ATS score
  skills_match_score FLOAT,               -- 0-100: Skills alignment %
  experience_score FLOAT,                 -- 0-100: Experience match %
  domain_score FLOAT,                     -- 0-100: Domain alignment %
  quality_score FLOAT,                    -- 0-100: Resume quality %
  feedback JSON,                          -- {overall: "...", highlights: [...]}
  strengths JSON,                         -- ["Skill 1", "Skill 2"]
  weaknesses JSON,                        -- ["Missing X", "Limited Y"]
  missing_skills JSON,                    -- ["Docker", "K8s"]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (job_description_id) REFERENCES job_descriptions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_evaluations_resume_id ON evaluations(resume_id);
CREATE INDEX idx_evaluations_job_id ON evaluations(job_description_id);
CREATE INDEX idx_evaluations_ats_score ON evaluations(ats_score DESC);
```

**Prisma Model:**
```typescript
model Evaluation {
  id               String   @id @default(uuid())
  resumeId         String   @map("resume_id")
  jobDescriptionId String   @map("job_description_id")
  atsScore         Float?   @map("ats_score")
  skillsMatchScore Float?   @map("skills_match_score")
  experienceScore  Float?   @map("experience_score")
  domainScore      Float?   @map("domain_score")
  qualityScore     Float?   @map("quality_score")
  feedback         Json?
  strengths        Json?
  weaknesses       Json?
  missingSkills    Json?    @map("missing_skills")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  resume           Resume           @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  jobDescription   JobDescription   @relation(fields: [jobDescriptionId], references: [id], onDelete: Cascade)
  recommendation   Recommendation?
  recruiterActions RecruiterAction[]
}
```

---

### 5. **recommendations** (Career Guidance)

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL,
  recommended_roles JSON,                 -- ["Senior Dev", "Tech Lead"]
  career_roadmap JSON,                    -- {years: 1-2: "...", 2-3: "..."}
  skill_gaps JSON,                        -- ["Docker", "AWS"]
  upskilling_suggestions JSON,            -- {skill: "...", resources: [...]}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_recommendations_evaluation_id ON recommendations(evaluation_id);
```

**Prisma Model:**
```typescript
model Recommendation {
  id                   String   @id @default(uuid())
  evaluationId         String   @unique @map("evaluation_id")
  recommendedRoles     Json?    @map("recommended_roles")
  careerRoadmap        Json?    @map("career_roadmap")
  skillGaps            Json?    @map("skill_gaps")
  upskillingSuggestions Json?  @map("upskilling_suggestions")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  evaluation           Evaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
}
```

---

### 6. **embeddings** (Vector Search - pgvector)

```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL,
  evaluation_id UUID,
  embedding vector(384),                  -- all-MiniLM-L6-v2 (384 dimensions)
  embedding_type VARCHAR(50),             -- 'resume' | 'job_description'
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

-- Vector similarity index (for fast semantic search)
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Indexes
CREATE INDEX idx_embeddings_resume_id ON embeddings(resume_id);
```

**Prisma Model:**
```typescript
model Embedding {
  id              String   @id @default(uuid())
  resumeId        String   @map("resume_id")
  evaluationId    String?  @map("evaluation_id")
  embedding       String   // Stored as string, queried as vector
  embeddingType   String   @map("embedding_type")
  createdAt       DateTime @default(now()) @map("created_at")

  resume          Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
}
```

---

### 7. **recruiter_actions** (Shortlist History)

```sql
CREATE TABLE recruiter_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL,
  evaluation_id UUID NOT NULL,
  action_type VARCHAR(50),                -- 'SHORTLIST' | 'REJECT' | 'NOTE'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_recruiter_actions_recruiter_id ON recruiter_actions(recruiter_id);
CREATE INDEX idx_recruiter_actions_evaluation_id ON recruiter_actions(evaluation_id);
```

**Prisma Model:**
```typescript
model RecruiterAction {
  id           String   @id @default(uuid())
  recruiterId  String   @map("recruiter_id")
  evaluationId String   @map("evaluation_id")
  actionType   String   @map("action_type")
  notes        String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  recruiter    User     @relation(fields: [recruiterId], references: [id], onDelete: Cascade)
  evaluation   Evaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
}
```

---

## Row-Level Security (RLS)

### Policy 1: Users See Only Own Resumes
```sql
CREATE POLICY resume_user_access ON resumes
  FOR SELECT USING (auth.uid() = user_id);
```

### Policy 2: Recruiters See Evaluated Candidates
```sql
CREATE POLICY evaluation_recruiter_access ON evaluations
  FOR SELECT USING (
    auth.uid() = job_description_id OR
    auth.uid() IN (SELECT recruiter_id FROM recruiter_actions)
  );
```

### Policy 3: Service Role Bypasses RLS
When using `supabaseAdmin` (service role key), RLS is bypassed for backend operations.

---

## Migration Checklist

- [ ] Run `database/supabase_migration.sql` in Supabase SQL Editor
- [ ] Verify all tables are created: `SELECT * FROM pg_tables WHERE schemaname='public'`
- [ ] Verify pgvector extension: `SELECT * FROM pg_extension WHERE extname='vector'`
- [ ] Test RLS policies: Try queries as different users
- [ ] Verify indexes: `SELECT * FROM pg_indexes WHERE schemaname='public'`

## Performance Tips

1. **Query Optimization**
   - Always filter by user_id first
   - Use LIMIT for large result sets
   - Avoid N+1 queries (use Prisma includes)

2. **Indexes**
   - Index all foreign keys
   - Index frequently filtered columns
   - Index sorting columns

3. **Vector Search**
   - Use `<->` operator for cosine similarity
   - Create IVFFLAT index for fast search
   - Cache results in Redis

---

See [Supabase Migration SQL](../database/supabase_migration.sql) for complete SQL statements.
