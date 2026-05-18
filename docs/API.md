# 🔌 API Documentation

## Base URLs

| Service | URL | Port |
|---------|-----|------|
| Backend API | `http://localhost:5000` | 5000 |
| AI Service | `http://localhost:8000` | 8000 |

## Authentication

All backend API requests (except health & auth) require:
```
Authorization: Bearer {supabase_auth_token}
```

Token format: `eyJhbGciOiJIUzI1NiIs...` (JWT from Supabase Auth)

---

## Backend API Endpoints

### Health Check

#### `GET /api/health`
Check system health (database, Redis, AI service).

**Response (200 OK):**
```json
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "redis": "available",
    "ai_service": "available"
  }
}
```

---

### Authentication

#### `POST /api/auth/register`
Register a new user (Candidate or Recruiter).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "John Doe",
  "role": "CANDIDATE"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CANDIDATE"
    },
    "session": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "...",
      "expires_in": 3600
    }
  }
}
```

---

#### `POST /api/auth/login`
Authenticate and get tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CANDIDATE"
    },
    "session": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "...",
      "expires_in": 3600
    }
  }
}
```

---

#### `POST /api/auth/refresh`
Refresh expired access token.

**Request:**
```json
{
  "refresh_token": "..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "expires_in": 3600
  }
}
```

---

### Candidate Routes

#### `POST /api/upload/resume`
Upload a resume (PDF or DOCX).

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form with file key `resume`

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-...",
    "userId": "uuid-...",
    "fileName": "my_resume.pdf",
    "filePath": "/uploads/...",
    "fileSize": 245120,
    "mimeType": "application/pdf",
    "parsedContent": "Full resume text content...",
    "skills": ["Python", "React", "PostgreSQL"],
    "experienceYears": 5,
    "createdAt": "2026-05-14T10:00:00Z"
  }
}
```

---

#### `GET /api/candidate/resumes`
List all user resumes.

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-...",
      "fileName": "my_resume.pdf",
      "fileSize": 245120,
      "createdAt": "2026-05-14T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### `GET /api/candidate/evaluations`
List all evaluations for user.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-...",
      "resumeId": "uuid-...",
      "jobDescriptionId": "uuid-...",
      "atsScore": 78.5,
      "skillsMatchScore": 85,
      "experienceScore": 72,
      "domainScore": 68,
      "qualityScore": 92,
      "feedback": {
        "overall": "Good match...",
        "highlights": [...]
      },
      "strengths": ["Strong Python", "React expertise"],
      "weaknesses": ["Limited DevOps"],
      "createdAt": "2026-05-14T10:00:00Z"
    }
  ]
}
```

---

#### `POST /api/evaluations`
Create new evaluation (trigger AI analysis).

**Request:**
```json
{
  "resumeId": "uuid-...",
  "jobDescription": "We are looking for a Senior Python Developer with 5+ years...",
  "jobTitle": "Senior Backend Engineer"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-...",
    "atsScore": 78.5,
    "skillsMatchScore": 85,
    "experienceScore": 72,
    "feedback": {...},
    "recommendation": {
      "recommendedRoles": ["Senior Dev", "Tech Lead"],
      "careerRoadmap": {...},
      "skillGaps": ["Docker", "K8s"]
    }
  }
}
```

---

#### `GET /api/evaluations/:id`
Get single evaluation details.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-...",
    "atsScore": 78.5,
    "resume": {
      "id": "uuid-...",
      "fileName": "resume.pdf"
    },
    "jobDescription": {
      "id": "uuid-...",
      "title": "Senior Backend Engineer"
    },
    "recommendation": {...}
  }
}
```

---

#### `POST /api/candidate/recommendations`
Get AI-powered career recommendations.

**Request:**
```json
{
  "resumeId": "uuid-...",
  "evaluationId": "uuid-..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendedRoles": [
      "Senior Python Developer",
      "Technical Lead",
      "Solutions Architect"
    ],
    "careerRoadmap": {
      "1-2_years": "Master cloud platforms (AWS/GCP)",
      "2-3_years": "Lead architectural decisions"
    },
    "skillGaps": ["Kubernetes", "Terraform", "gRPC"],
    "upskillingSuggestions": {
      "Kubernetes": {
        "level": "beginner",
        "resources": ["Linux Academy", "Udemy course"]
      }
    }
  }
}
```

---

### Recruiter Routes

#### `GET /api/recruiter/dashboard`
Dashboard with analytics.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalCandidates": 45,
    "topCandidates": [
      {
        "id": "uuid-...",
        "name": "Jane Smith",
        "atsScore": 92,
        "evaluation": {...}
      }
    ],
    "recentEvaluations": [...],
    "shortlistedCount": 12
  }
}
```

---

#### `GET /api/recruiter/candidates`
List all candidates with their evaluations.

**Query Parameters:**
- `limit` (optional): Results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `minScore` (optional): Filter by minimum ATS score
- `role` (optional): Filter by job role

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-...",
      "name": "John Doe",
      "email": "john@example.com",
      "evaluation": {
        "atsScore": 78.5,
        "jobTitle": "Senior Backend Engineer"
      },
      "shortlistedAt": null
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### `GET /api/recruiter/candidates/:id`
Get detailed candidate profile.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-...",
    "name": "John Doe",
    "email": "john@example.com",
    "location": "San Francisco, CA",
    "resume": {
      "fileName": "resume.pdf",
      "skills": ["Python", "React"],
      "experienceYears": 5
    },
    "evaluations": [...],
    "shortlistStatus": {
      "isShortlisted": true,
      "notes": "Great fit for role",
      "shortlistedAt": "2026-05-14T10:00:00Z"
    }
  }
}
```

---

#### `POST /api/recruiter/shortlist`
Shortlist a candidate.

**Request:**
```json
{
  "evaluationId": "uuid-...",
  "notes": "Strong Python skills, great cultural fit"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-...",
    "evaluationId": "uuid-...",
    "recruiterId": "uuid-...",
    "actionType": "SHORTLIST",
    "notes": "Strong Python skills",
    "createdAt": "2026-05-14T10:00:00Z"
  }
}
```

---

#### `GET /api/recruiter/shortlisted`
Get all shortlisted candidates.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-...",
      "evaluation": {
        "id": "uuid-...",
        "atsScore": 85,
        "resume": {
          "user": {
            "name": "Jane Smith",
            "email": "jane@example.com"
          }
        }
      },
      "notes": "Great fit",
      "createdAt": "2026-05-14T10:00:00Z"
    }
  ]
}
```

---

#### `DELETE /api/recruiter/shortlist/:id`
Remove from shortlist.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Removed from shortlist"
}
```

---

## AI Service Endpoints

### Health

#### `GET /api/health`
Check AI service status.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "NexaRecruit AI Service",
  "version": "1.0.0"
}
```

---

### Resume Parsing

#### `POST /api/parse-resume`
Parse uploaded resume file.

**Request:**
- Content-Type: `multipart/form-data`
- File key: `file`

**Response (200 OK):**
```json
{
  "filename": "resume.pdf",
  "content": "Full parsed resume text...",
  "length": 2145
}
```

---

### Evaluation Pipeline

#### `POST /api/evaluate`
Run complete AI evaluation (6-agent pipeline).

**Request:**
```json
{
  "resume_text": "Full parsed resume text...",
  "job_description": "Job description text...",
  "job_title": "Senior Backend Engineer"
}
```

**Response (200 OK):**
```json
{
  "ats_score": 78.5,
  "skills_match": 85,
  "experience_match": 72,
  "domain_score": 68,
  "quality_score": 92,
  "feedback": {
    "overall": "Good match for the role...",
    "highlights": [...]
  },
  "strengths": ["Expert Python", "Strong React skills"],
  "weaknesses": ["Limited DevOps exposure"],
  "missing_skills": ["Docker", "Kubernetes"],
  "recommendations": {
    "roles": ["Senior Dev", "Tech Lead"],
    "roadmap": {...},
    "skill_gaps": ["Docker", "K8s"],
    "upskilling": {...}
  }
}
```

---

### Recommendations

#### `POST /api/recommendations`
Generate career recommendations.

**Request:**
```json
{
  "resume_text": "...",
  "job_description": "...",
  "current_skills": ["Python", "React"]
}
```

**Response (200 OK):**
```json
{
  "recommended_roles": ["Senior Developer", "Tech Lead"],
  "career_roadmap": {
    "1-2_years": "Master cloud platforms",
    "2-3_years": "Lead architecture decisions"
  },
  "skill_gaps": ["Kubernetes", "Terraform"],
  "upskilling_suggestions": {...}
}
```

---

## Error Responses

All errors return consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [...]
  }
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |
| 503 | Service Unavailable - AI service down |

---

## Rate Limiting

- **Unauthenticated**: 20 requests/minute per IP
- **Authenticated**: 100 requests/minute per user
- **Evaluation endpoint**: 10 evaluations/hour per user

---

## Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "CANDIDATE"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Get health
curl http://localhost:5000/api/health
```

### Using Postman

1. Import the API collection from `/docs/postman_collection.json`
2. Set `base_url` variable to `http://localhost:5000`
3. Set `auth_token` from login response
4. Run requests

---

See [Troubleshooting](./TROUBLESHOOTING.md) for common API issues.
