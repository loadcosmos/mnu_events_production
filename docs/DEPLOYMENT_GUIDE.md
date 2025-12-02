# Production Deployment Guide

**Last Updated:** 2025-12-02
**Version:** 1.0
**Status:** Production Ready ✅

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database Migration](#database-migration)
7. [Platform-Specific Guides](#platform-specific-guides)
8. [Security Checklist](#security-checklist)
9. [Post-Deployment Testing](#post-deployment-testing)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This guide covers production deployment of MNU Events Platform with:
- **Frontend:** React 19 + Vite (static site)
- **Backend:** NestJS 10 + PostgreSQL (Node.js server)
- **Architecture:** Separate frontend/backend deployment (recommended)

### Deployment Options

| Option | Frontend | Backend | Best For |
|--------|----------|---------|----------|
| **A** | Vercel | Railway | Easiest, auto-scaling |
| **B** | Netlify | Render | Free tier friendly |
| **C** | S3+CloudFront | Heroku | AWS ecosystem |
| **D** | VPS (nginx) | VPS (PM2) | Full control, cheapest |

---

## ✅ Prerequisites

### Required
- [ ] **Node.js 18+** installed
- [ ] **PostgreSQL 14+** database (remote or managed)
- [ ] **Domain names** (optional but recommended):
  - Frontend: `mnu-events.com`
  - Backend API: `api.mnu-events.com`
- [ ] **SSL certificates** (auto with Vercel/Netlify/Railway)

### Optional but Recommended
- [ ] Email service (Gmail SMTP, SendGrid, etc.)
- [ ] Redis for caching (future feature)
- [ ] CDN for static assets

---

## 🔧 Environment Configuration

### Step 1: Backend Environment Variables

Create `backend/.env` for production:

```bash
# ==================================================
# PRODUCTION ENVIRONMENT VARIABLES
# ==================================================

# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3001
HOST=0.0.0.0

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/mnu_events?schema=public"

# JWT Secrets (GENERATE NEW ONES!)
JWT_SECRET="CHANGE_THIS_TO_RANDOM_64_CHAR_STRING"
JWT_REFRESH_SECRET="CHANGE_THIS_TO_ANOTHER_RANDOM_64_CHAR_STRING"
JWT_EXPIRATION="1h"
JWT_REFRESH_EXPIRATION="7d"

# CSRF Protection (GENERATE NEW!)
CSRF_SECRET="CHANGE_THIS_TO_RANDOM_32_CHAR_STRING"

# CORS Origins (Your frontend URLs)
CORS_ORIGIN=https://mnu-events.com,https://www.mnu-events.com

# Email Configuration (Optional)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password
EMAIL_FROM="MNU Events <noreply@mnu-events.com>"

# Redis (Optional - for future caching)
# REDIS_URL=redis://user:password@host:6379

# Logging
LOG_LEVEL=info
```

**🔒 Generate Secrets:**

```bash
# Generate JWT_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate CSRF_SECRET (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Step 2: Frontend Environment Variables

Create `.env.production` for production build:

```bash
# ==================================================
# FRONTEND PRODUCTION ENVIRONMENT
# ==================================================

# Backend API URL (REQUIRED for production!)
# Use your deployed backend URL with /api suffix
VITE_API_URL=https://api.mnu-events.com/api

# NOTE: VITE_BACKEND_URL is NOT used in production
# (only for dev mode Vite proxy)
```

**Important:** Frontend env vars must start with `VITE_` to be embedded in build.

### Step 3: Platform-Specific Environment Setup

**Vercel (Frontend):**
- Dashboard → Project → Settings → Environment Variables
- Add: `VITE_API_URL=https://api.mnu-events.com/api`

**Railway (Backend):**
- Dashboard → Project → Variables
- Add all backend env vars from above

**Netlify (Frontend):**
- Site settings → Build & deploy → Environment
- Add: `VITE_API_URL=https://api.mnu-events.com/api`

---

## 🚀 Backend Deployment

### Option A: Railway (Recommended)

**1. Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

**2. Initialize Project:**
```bash
cd backend
railway init
```

**3. Configure Database:**
```bash
# Railway will provision PostgreSQL
railway add postgresql
```

**4. Set Environment Variables:**
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
# ... (add all vars from backend/.env)
```

**5. Deploy:**
```bash
railway up
```

**6. Run Migrations:**
```bash
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

### Option B: Heroku

**1. Create App:**
```bash
heroku login
heroku create mnu-events-api
```

**2. Add PostgreSQL:**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

**3. Set Env Vars:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
# ... (add all vars)
```

**4. Deploy:**
```bash
git push heroku main
```

**5. Run Migrations:**
```bash
heroku run npx prisma migrate deploy
heroku run npx prisma db seed
```

### Option C: VPS (Ubuntu)

**1. Setup Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql nginx
```

**2. Clone & Install:**
```bash
cd /var/www
git clone https://github.com/your-org/mnu-events.git
cd mnu-events/backend
npm ci --production
```

**3. Setup PostgreSQL:**
```bash
sudo -u postgres createdb mnu_events
sudo -u postgres createuser mnu_user
# Set password and permissions
```

**4. Configure .env:**
```bash
cp .env.example .env
nano .env  # Edit with production values
```

**5. Run Migrations:**
```bash
npx prisma migrate deploy
npx prisma db seed
```

**6. Setup PM2:**
```bash
npm install -g pm2
pm2 start npm --name "mnu-backend" -- run start:prod
pm2 save
pm2 startup
```

**7. Configure Nginx:**
```nginx
server {
    listen 80;
    server_name api.mnu-events.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**8. SSL with Certbot:**
```bash
sudo certbot --nginx -d api.mnu-events.com
```

---

## 🎨 Frontend Deployment

### Option A: Vercel (Recommended)

**1. Install Vercel CLI:**
```bash
npm install -g vercel
vercel login
```

**2. Configure Build:**

Create `vercel.json` in project root:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm ci",
  "env": {
    "VITE_API_URL": "https://api.mnu-events.com/api"
  }
}
```

**3. Deploy:**
```bash
vercel --prod
```

**4. Configure Domain:**
- Vercel Dashboard → Domains → Add `mnu-events.com`

### Option B: Netlify

**1. Create `netlify.toml`:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_API_URL = "https://api.mnu-events.com/api"
```

**2. Deploy:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Option C: AWS S3 + CloudFront

**1. Build:**
```bash
VITE_API_URL=https://api.mnu-events.com/api npm run build
```

**2. Upload to S3:**
```bash
aws s3 sync dist/ s3://mnu-events-frontend --delete
```

**3. Create CloudFront Distribution:**
- Origin: S3 bucket
- Default root object: `index.html`
- Error pages: 404 → `/index.html` (for SPA routing)

### Option D: VPS (Nginx)

**1. Build Locally:**
```bash
VITE_API_URL=https://api.mnu-events.com/api npm run build
```

**2. Upload to VPS:**
```bash
scp -r dist/* user@server:/var/www/mnu-events/
```

**3. Configure Nginx:**
```nginx
server {
    listen 80;
    server_name mnu-events.com;
    root /var/www/mnu-events;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**4. SSL:**
```bash
sudo certbot --nginx -d mnu-events.com
```

---

## 🗄️ Database Migration

### Initial Migration (Fresh Database)

```bash
# Backend directory
cd backend

# Run all migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

### Update Existing Database

```bash
# Pull latest code
git pull origin main

# Run new migrations only
npx prisma migrate deploy

# Restart backend
pm2 restart mnu-backend  # or railway restart, heroku restart, etc.
```

### Rollback Migration (if needed)

```bash
# Prisma doesn't support automatic rollback
# Manual rollback:
# 1. Identify migration to rollback
ls backend/prisma/migrations/

# 2. Delete migration folder
rm -rf backend/prisma/migrations/20251202185410_fix_checkin_modes_data/

# 3. Reset database (DESTRUCTIVE!)
npx prisma migrate reset  # Only in dev/staging!

# 4. Re-run migrations
npx prisma migrate deploy
```

---

## 🔐 Security Checklist

Before going live:

### Backend Security
- [ ] **NODE_ENV=production** is set
- [ ] **JWT secrets** are strong random strings (not defaults!)
- [ ] **CSRF secret** is strong random string
- [ ] **CORS_ORIGIN** only includes your frontend domains
- [ ] **HTTPS** is enabled (cookies use `secure: true`)
- [ ] **Database** uses strong password
- [ ] **Database** allows connections only from backend IPs
- [ ] **Environment variables** are not in Git
- [ ] **Rate limiting** is enabled (TODO: implement if not done)
- [ ] **Helmet** security headers are active (already done ✅)

### Frontend Security
- [ ] **API requests** go to HTTPS backend only
- [ ] **VITE_API_URL** points to production backend
- [ ] **No sensitive data** in client-side code
- [ ] **Content Security Policy** headers from backend
- [ ] **HTTPS** is enabled for frontend domain

### Database Security
- [ ] **Backup** strategy is in place
- [ ] **Access logs** are enabled
- [ ] **SSL/TLS** connection to database (if supported)

---

## ✅ Post-Deployment Testing

### 1. Health Check

```bash
# Backend health
curl https://api.mnu-events.com/api/health

# Expected: {"status":"ok","database":"connected"}
```

### 2. Authentication Flow

1. Open `https://mnu-events.com/register`
2. Register new user
3. Verify email (check email service)
4. Login
5. Check cookies in DevTools:
   - `access_token` (HttpOnly, Secure, SameSite=Strict)
   - `refresh_token` (HttpOnly, Secure, SameSite=Strict)

### 3. API Requests

1. Open DevTools → Network
2. Navigate around the app
3. Verify:
   - All API requests go to `https://api.mnu-events.com`
   - No CORS errors
   - No Mixed Content warnings
   - Status codes are 200/201/204 (not 401/403/500)

### 4. QR Check-In (Mobile)

1. Open on mobile: `https://mnu-events.com`
2. Login as student
3. Go to "Мои регистрации"
4. Click "Сканировать QR-код"
5. Verify:
   - Camera permission prompt appears
   - Camera feed is visible
   - QR scanning works

### 5. Performance

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=https://mnu-events.com

# Target scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 90+
```

---

## 🐛 Troubleshooting

### "VITE_API_URL not set" Error

**Problem:** Frontend shows error about missing VITE_API_URL in console.

**Solution:**
```bash
# Set in platform environment variables
# Vercel: Settings → Environment Variables
# Netlify: Site settings → Build & deploy → Environment
VITE_API_URL=https://api.mnu-events.com/api

# Rebuild and redeploy
```

### CORS Error

**Problem:** Browser console shows CORS policy blocked request.

**Solution:**
```bash
# Backend .env
CORS_ORIGIN=https://mnu-events.com,https://www.mnu-events.com

# Restart backend
railway restart  # or pm2 restart, heroku restart
```

### Cookies Not Working

**Problem:** User logs in but immediately logged out.

**Causes:**
1. **HTTP backend** - Cookies require HTTPS in production
   ```bash
   # Backend must be HTTPS!
   # Check: curl https://api.mnu-events.com/api/health
   ```

2. **Wrong CORS_ORIGIN**
   ```bash
   # Backend .env
   CORS_ORIGIN=https://mnu-events.com  # Must match frontend domain exactly
   ```

3. **SameSite=Strict + different domains**
   ```bash
   # Only issue if frontend/backend on different top-level domains
   # Solution: Use same domain (e.g., mnu-events.com and api.mnu-events.com)
   ```

### Database Connection Failed

**Problem:** Backend logs show "Can't reach database server".

**Solutions:**
```bash
# 1. Check DATABASE_URL format
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# 2. Check firewall rules (VPS only)
sudo ufw allow from BACKEND_IP to any port 5432

# 3. Check PostgreSQL pg_hba.conf (VPS only)
# Add: host all all BACKEND_IP/32 md5

# 4. Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Migration Failed

**Problem:** `npx prisma migrate deploy` fails.

**Solution:**
```bash
# 1. Check database connection
npx prisma db pull

# 2. Reset migration history (STAGING ONLY! NEVER IN PRODUCTION!)
npx prisma migrate resolve --applied "migration_name"

# 3. If truly stuck (DESTRUCTIVE!):
# Backup data first!
pg_dump DATABASE_URL > backup.sql
npx prisma migrate reset
npx prisma migrate deploy
# Restore data if needed
```

---

## 📞 Support

**Issues:** https://github.com/your-org/mnu-events/issues
**Documentation:** See `README.md`, `PROJECT_STATUS.md`
**Contact:** dev@mnu-events.com

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-02 | 1.0 | Initial deployment guide |

---

**🎉 Ready to deploy? Follow the steps above and launch your platform!**
