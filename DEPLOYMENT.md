# Deployment Guide

Complete guide for deploying the Smart Real Estate Assistant to production.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production:

### Code Quality

- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Code reviewed and approved
- [ ] No hardcoded credentials
- [ ] Environment variables configured
- [ ] Error handling implemented
- [ ] Logging configured

### Security

- [ ] API keys secured in environment variables
- [ ] CORS configured properly
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] HTTPS enabled
- [ ] Rate limiting configured (if applicable)
- [ ] Row Level Security (RLS) policies active

### Performance

- [ ] Images optimized
- [ ] Code minified and bundled
- [ ] Database indexes created
- [ ] Caching configured
- [ ] CDN setup (if applicable)

### Documentation

- [ ] README updated
- [ ] API documentation complete
- [ ] Deployment notes added
- [ ] Environment variables documented

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Automatic deployments from Git
- Built-in CDN
- Zero configuration
- Preview deployments for PRs

**Steps**:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # From project root
   vercel
   
   # Follow prompts
   # - Set up and deploy
   # - Link to existing project or create new
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
   vercel env add VITE_GOOGLE_MAPS_API_KEY production
   vercel env add VITE_BACKEND_URL production
   ```

5. **Production Deployment**
   ```bash
   vercel --prod
   ```

**Auto-Deploy from GitHub**:
- Connect GitHub repository
- Vercel will auto-deploy on push to main branch
- Preview deployments for pull requests

---

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build Locally**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Configure**
   - Set environment variables in Netlify dashboard
   - Configure redirects in `netlify.toml`

---

### Option 3: AWS S3 + CloudFront

1. **Build**
   ```bash
   npm run build
   ```

2. **Upload to S3**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. **Invalidate CloudFront Cache**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DISTRIBUTION_ID \
     --paths "/*"
   ```

---

### Option 4: Lovable (Current Platform)

**Publishing on Lovable**:

1. Click **Publish** button (top-right on desktop, bottom-right on mobile)
2. Review changes
3. Click **Update** to deploy frontend
4. Note: Backend changes deploy automatically

**Custom Domain**:
- Navigate to Project > Settings > Domains
- Click "Connect Domain"
- Follow DNS configuration instructions
- Requires paid Lovable plan

---

## Backend Deployment

### Option 1: Render (Recommended)

**Why Render?**
- Easy Python deployment
- Automatic HTTPS
- Auto-scaling
- Affordable pricing

**Steps**:

1. **Create `render.yaml`** (in Backend folder):
   ```yaml
   services:
     - type: web
       name: real-estate-api
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: gunicorn main:app -c gunicorn_config.py
       envVars:
         - key: SUPABASE_URL
           sync: false
         - key: SUPABASE_KEY
           sync: false
         - key: OPENAI_API_KEY
           sync: false
         - key: DEBUG
           value: false
   ```

2. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - New > Web Service
   - Connect GitHub repository
   - Select Backend folder

3. **Configure Environment Variables**
   - Add all variables from `.env`
   - Mark sensitive variables as secret

4. **Deploy**
   - Render will automatically deploy
   - Future pushes trigger auto-deploy

---

### Option 2: DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean > Apps
   - Create App from GitHub
   - Select repository and Backend folder

2. **Configure Build**
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `gunicorn main:app -c gunicorn_config.py`

3. **Set Environment Variables**
   - Add all `.env` variables

4. **Deploy**
   - Click "Deploy"

---

### Option 3: AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize**
   ```bash
   cd Backend
   eb init -p python-3.11 real-estate-api
   ```

3. **Create Environment**
   ```bash
   eb create production-env
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv SUPABASE_URL=xxx SUPABASE_KEY=xxx OPENAI_API_KEY=xxx
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

---

### Option 4: Self-Hosted (VPS)

**Requirements**:
- Ubuntu 22.04 LTS
- Python 3.10+
- Nginx
- Supervisor or systemd

**Steps**:

1. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install python3.11 python3.11-venv nginx supervisor
   ```

2. **Setup Application**
   ```bash
   # Create app directory
   sudo mkdir -p /var/www/real-estate-api
   cd /var/www/real-estate-api
   
   # Clone repository
   git clone <your-repo-url> .
   cd Backend
   
   # Create virtual environment
   python3.11 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Create Environment File**
   ```bash
   sudo nano /var/www/real-estate-api/Backend/.env
   # Add all environment variables
   ```

4. **Configure Supervisor**
   ```bash
   sudo nano /etc/supervisor/conf.d/real-estate-api.conf
   ```
   
   ```ini
   [program:real-estate-api]
   directory=/var/www/real-estate-api/Backend
   command=/var/www/real-estate-api/Backend/venv/bin/gunicorn main:app -c gunicorn_config.py
   user=www-data
   autostart=true
   autorestart=true
   redirect_stderr=true
   stdout_logfile=/var/log/real-estate-api.log
   environment=PATH="/var/www/real-estate-api/Backend/venv/bin"
   ```

5. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/real-estate-api
   ```
   
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

6. **Enable and Start Services**
   ```bash
   # Enable Nginx site
   sudo ln -s /etc/nginx/sites-available/real-estate-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   
   # Start application
   sudo supervisorctl reread
   sudo supervisorctl update
   sudo supervisorctl start real-estate-api
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

## Database Setup

### Using Supabase (Recommended)

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note: URL and keys

2. **Run Migrations**
   - Use Supabase Studio SQL Editor
   - Run migration files from `supabase/migrations/` in order

3. **Enable Extensions**
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

4. **Import Data**
   - Use Supabase Studio Table Editor
   - Import CSV files for properties, schools, universities, mosques

5. **Configure RLS Policies**
   - Enable Row Level Security on all tables
   - Add policies for authenticated users

---

### Self-Hosted PostgreSQL

1. **Install PostgreSQL 15**
   ```bash
   sudo apt install postgresql-15 postgresql-15-postgis-3
   ```

2. **Install pgvector**
   ```bash
   cd /tmp
   git clone https://github.com/pgvector/pgvector.git
   cd pgvector
   make
   sudo make install
   ```

3. **Create Database**
   ```bash
   sudo -u postgres psql
   ```
   ```sql
   CREATE DATABASE real_estate;
   \c real_estate
   CREATE EXTENSION postgis;
   CREATE EXTENSION vector;
   CREATE EXTENSION pg_trgm;
   ```

4. **Run Migrations**
   ```bash
   psql -U postgres -d real_estate -f supabase/migrations/001_initial_schema.sql
   ```

---

## Environment Configuration

### Production Environment Variables

**Frontend (.env.production)**:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_BACKEND_URL=https://api.yourdomain.com
```

**Backend (.env)**:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
OPENAI_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...
DEBUG=False
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=1000
```

### Security Best Practices

1. **Never Commit .env Files**
   - Add to `.gitignore`
   - Use example files (.env.example)

2. **Rotate Keys Regularly**
   - Change API keys every 90 days
   - Update in all environments

3. **Use Secrets Management**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

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
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
  
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
  
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

---

## Monitoring & Logging

### Application Monitoring

**Sentry** (Error Tracking):

1. **Install**
   ```bash
   npm install @sentry/react
   pip install sentry-sdk
   ```

2. **Configure Frontend**
   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     environment: "production"
   });
   ```

3. **Configure Backend**
   ```python
   import sentry_sdk
   
   sentry_sdk.init(
       dsn="your-sentry-dsn",
       environment="production"
   )
   ```

---

### Database Monitoring

**Supabase Dashboard**:
- Monitor query performance
- View database logs
- Track connection pool usage

**Self-Hosted**:
```bash
# Install pgAdmin
sudo apt install pgadmin4

# Or use command-line monitoring
sudo -u postgres psql
\x
SELECT * FROM pg_stat_activity;
```

---

## Troubleshooting

### Common Issues

#### Frontend Build Fails

**Error**: `Module not found`

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Backend Won't Start

**Error**: `ModuleNotFoundError`

**Solution**:
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

#### Database Connection Failed

**Error**: `connection refused`

**Solution**:
- Check database URL
- Verify network connectivity
- Check firewall rules
- Verify credentials

#### High Memory Usage

**Solution**:
- Increase server memory
- Optimize database queries
- Enable caching
- Scale horizontally

---

## Post-Deployment

### Verification Checklist

- [ ] Frontend loads correctly
- [ ] API health check passes
- [ ] Database queries work
- [ ] Authentication works
- [ ] Search functionality works
- [ ] Maps display correctly
- [ ] Images load properly
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Monitoring active

### Performance Testing

```bash
# Load testing with Artillery
npm install -g artillery
artillery quick --count 10 --num 50 https://api.yourdomain.com/health
```

---

## Rollback Procedure

If deployment fails:

1. **Vercel/Netlify**: Click "Rollback" in dashboard
2. **Render**: Redeploy previous commit
3. **Self-Hosted**: 
   ```bash
   git checkout <previous-commit>
   sudo supervisorctl restart real-estate-api
   ```

---

## Support

For deployment issues:
- Check [Troubleshooting](#troubleshooting)
- Review platform documentation
- Contact DevOps team
- Open support ticket

---

**Last Updated**: 2025
