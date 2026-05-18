# 🚢 Deployment Guide

## Production Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase migrations applied
- [ ] Database backups configured
- [ ] CORS configured for production domain
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting enabled
- [ ] Logging aggregation setup
- [ ] Monitoring alerts configured
- [ ] CI/CD pipeline ready
- [ ] Disaster recovery plan

---

## Environment Variables

### Backend (.env)
```env
# App Config
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Service
AI_SERVICE_URL=http://ai-service:8000

# Redis (optional)
REDIS_URL=redis://redis:6379

# CORS
CORS_ORIGIN=https://yourdomain.com

# JWT (managed by Supabase)
JWT_SECRET=managed-by-supabase
```

### Frontend (.env.local)
```env
# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Environment
NEXT_PUBLIC_ENV=production
```

### AI Service (.env)
```env
# App Config
ENVIRONMENT=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres

# Groq AI
GROQ_API_KEY=your-key-here
GROQ_MODEL=llama-3.3-70b-versatile

# Redis (optional)
REDIS_URL=redis://redis:6379
```

---

## Docker Deployment

### Docker Compose (Production)

```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000
      - NEXT_PUBLIC_ENV=production
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - NODE_ENV=production
    depends_on:
      - postgres

  ai-service:
    build:
      context: ./ai-services
      dockerfile: Dockerfile.prod
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - ENVIRONMENT=production
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=nexarecruit
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Cloud Deployment

### Azure App Service

1. **Create Resource Group**
   ```bash
   az group create --name NexaRecruit --location eastus
   ```

2. **Deploy Backend**
   ```bash
   az webapp up --name nexarecruit-backend --resource-group NexaRecruit --runtime "node|20"
   ```

3. **Deploy Frontend**
   ```bash
   az staticwebapp create --name nexarecruit-frontend --resource-group NexaRecruit
   ```

4. **Configure Environment**
   ```bash
   az webapp config appsettings set --resource-group NexaRecruit \
     --name nexarecruit-backend \
     --settings DATABASE_URL=$DATABASE_URL
   ```

### AWS

**ECS + ECR + RDS**

1. Create ECR repositories for each service
2. Push Docker images
3. Create ECS cluster
4. Configure RDS PostgreSQL
5. Create load balancer
6. Set environment variables in ECS task definitions

### Render.com (Easiest)

1. Connect GitHub repository
2. Create services:
   - Frontend (Static Site)
   - Backend (Web Service)
   - AI Service (Background Worker)
3. Configure environment variables
4. Deploy

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install & Test
        run: |
          cd backend && npm install && npm run test
          cd ../frontend && npm install && npm run test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Azure
        run: |
          az login --service-principal -u ${{ secrets.AZURE_CLIENT_ID }} \
            -p ${{ secrets.AZURE_CLIENT_SECRET }} \
            --tenant ${{ secrets.AZURE_TENANT_ID }}
          az deployment group create \
            --resource-group NexaRecruit \
            --template-file infrastructure/main.bicep
```

---

## Database Migration (Production)

### Backup Before Migrating
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Apply Migrations
```bash
# Using Supabase SQL Editor
1. Go to SQL Editor
2. Create new query from migration file
3. Review & execute
4. Verify with SELECT statements
```

### Rollback (if needed)
```bash
psql $DATABASE_URL < backup_20260514.sql
```

---

## Performance Optimization

### Database
- [ ] Enable pgvector indexes
- [ ] Add appropriate indexes on foreign keys
- [ ] Set up connection pooling (PgBouncer)
- [ ] Configure autovacuum

### Backend
- [ ] Enable gzip compression
- [ ] Configure Redis caching
- [ ] Set up rate limiting
- [ ] Enable query optimization

### Frontend
- [ ] Minify CSS/JS
- [ ] Enable image optimization
- [ ] Set cache headers
- [ ] Use CDN for static assets

### AI Service
- [ ] Batch processing for evaluations
- [ ] Cache Groq responses
- [ ] Load balance multiple instances
- [ ] Set appropriate timeouts

---

## Monitoring & Logging

### Application Insights (Azure)
```typescript
import { ApplicationInsightsClient } from '@azure/monitor-opentelemetry';

const client = new ApplicationInsightsClient({
  instrumentationKey: process.env.APPINSIGHTS_KEY
});

client.trackEvent({
  name: 'evaluation_completed',
  properties: { score: 78.5 }
});
```

### Datadog Integration
```yaml
# datadog.yaml
api_key: YOUR_API_KEY
site: datadoghq.com
logs_config:
  - type: file
    path: /var/log/nexarecruit/*.log
```

### CloudWatch (AWS)
```typescript
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const client = new CloudWatchClient({ region: 'us-east-1' });
await client.send(new PutMetricDataCommand({
  Namespace: 'NexaRecruit',
  MetricData: [{
    MetricName: 'EvaluationLatency',
    Value: 1234,
    Unit: 'Milliseconds'
  }]
}));
```

---

## SSL/TLS Certificate

### Let's Encrypt (Free)
```bash
certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
```

### Configure Nginx
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://frontend:3000;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://backend:5000;
    }
}
```

---

## Disaster Recovery

### Backup Strategy
- **Frequency**: Daily full backup + hourly incremental
- **Retention**: 30 days
- **Storage**: Multiple regions
- **Testing**: Monthly restore test

### Backup Commands
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL | gzip > backup.sql.gz

# Restore
gunzip < backup.sql.gz | psql $DATABASE_URL
```

### Failover Plan
1. Monitor primary database
2. Automatic failover to replica (if configured)
3. Alert ops team
4. Update DNS to backup region
5. Verify all services operational

---

## Production Checklist

```
Security
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] CORS configured for specific domains
- [ ] Rate limiting enabled
- [ ] API key rotation implemented
- [ ] Secrets manager configured

Database
- [ ] Backups automated
- [ ] RLS policies verified
- [ ] Connection pooling configured
- [ ] Indexes optimized

Monitoring
- [ ] Error tracking active
- [ ] Performance metrics collected
- [ ] Logs aggregated
- [ ] Alerts configured

Deployment
- [ ] Blue-green deployment ready
- [ ] Rollback plan documented
- [ ] Database migration tested
- [ ] Load testing completed

Compliance
- [ ] GDPR compliance verified
- [ ] Data encryption enabled
- [ ] Audit logging active
- [ ] Incident response plan
```

---

## Scaling

### Horizontal Scaling
```bash
# Scale backend to 3 instances
az container create --resource-group NexaRecruit \
  --name nexarecruit-backend-2 \
  --image nexarecruit-backend:latest \
  --cpu 2 --memory 4 \
  --environment-variables DATABASE_URL=$DATABASE_URL
```

### Load Balancing
Use Azure Load Balancer or AWS ALB to distribute traffic across multiple instances.

### Database Scaling
- Read replicas for query offloading
- Connection pooling (PgBouncer)
- Query optimization
- Partitioning large tables

---

See [Troubleshooting](./TROUBLESHOOTING.md) for production issues.
