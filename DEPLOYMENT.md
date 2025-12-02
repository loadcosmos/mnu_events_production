# MNU Events Platform - Deployment Guide

**Project:** MNU Events Platform (University Capstone Project)  
**Status:** Production Ready  
**Last Updated:** December 2025

---

## Table of Contents

1. [Quick Start (30-40 minutes)](#quick-start)
2. [Deployment Architecture](#deployment-architecture)
3. [Railway Setup (Backend)](#railway-setup)
4. [Vercel Setup (Frontend)](#vercel-setup)
5. [Environment Variables](#environment-variables)
6. [Testing & Verification](#testing-verification)
7. [Troubleshooting](#troubleshooting)
8. [Post-Deployment](#post-deployment)

---

## Quick Start

### Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Vercel account (sign up at https://vercel.com)
- Local project running successfully

### Deployment Overview

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Railway (Backend + Database) - 15-20 minutes   │
│ Step 2: Vercel (Frontend) - 10-15 minutes              │
│ Step 3: Testing & Configuration - 10 minutes           │
└─────────────────────────────────────────────────────────┘
Total Time: 30-40 minutes
```

---

## Deployment Architecture

### Current Setup: Railway + Vercel

**Why this stack:**
- ⚡ Fastest deployment (30-40 minutes)
- 💰 Free tier available for testing
- 🎓 No DevOps skills required
- 🔄 Easy to migrate later

```
┌─────────────────────────────────────────────────────┐
│                    Users/Students                    │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐            ┌────▼────┐
    │ Vercel  │            │ Railway │
    │ Frontend│◄──────────►│ Backend │
    │ (React) │   CORS     │ (NestJS)│
    └─────────┘            └────┬────┘
                                │
                      ┌─────────┴─────────┐
                      │                   │
                 ┌────▼─────┐       ┌────▼────┐
                 │PostgreSQL│       │  Redis  │
                 │ Database │       │  Cache  │
                 └──────────┘       └─────────┘
```

---

## Railway Setup

### Step 1: Create New Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `mnu_events_production`
5. Set Root Directory: `backend`

### Step 2: Add PostgreSQL Database

1. In Railway project, click "+" (New)
2. Select "Database" → "PostgreSQL"
3. Railway automatically creates `DATABASE_URL` variable

### Step 3: Configure Environment Variables

Go to Railway → Your Backend Service → Variables:

```bash
# Required - Generate random secrets!
JWT_SECRET=your_random_secret_64_chars
REFRESH_TOKEN_SECRET=another_random_secret_64_chars
EMAIL_VERIFICATION_SECRET=yet_another_random_secret_64_chars

# Payment Integration
PAYMENT_SECRET=your_kaspi_payment_secret

# CORS (update after Vercel deployment)
CORS_ORIGIN=*

# Email Configuration (optional for demo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Other Settings
NODE_ENV=production
PORT=3001
```

**Generate secrets:**
```bash
openssl rand -base64 48  # For JWT_SECRET
openssl rand -base64 48  # For REFRESH_TOKEN_SECRET
openssl rand -base64 48  # For EMAIL_VERIFICATION_SECRET
```

### Step 4: Deploy Backend

1. Railway automatically deploys on push
2. Wait 2-3 minutes for build
3. Check deployment logs for errors
4. Copy the generated URL (e.g., `mnu-events-backend.up.railway.app`)

### Step 5: Verify Database Migration

The Dockerfile automatically runs:
```bash
npx prisma db push --accept-data-loss --skip-generate
```

Check Railway logs to confirm database schema was created.

---

## Vercel Setup

### Step 1: Import Project

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import Git Repository → Select `mnu_events_production`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)

### Step 2: Add Environment Variable

In Vercel → Settings → Environment Variables:

```bash
VITE_API_URL=https://your-backend-url.up.railway.app
```

Replace with your actual Railway backend URL (without `/api` suffix).

### Step 3: Deploy Frontend

1. Click "Deploy"
2. Wait 1-2 minutes
3. Vercel provides a URL (e.g., `mnu-events.vercel.app`)

### Step 4: Update CORS on Backend

1. Return to Railway → Backend Service → Variables
2. Update `CORS_ORIGIN`:
   ```bash
   CORS_ORIGIN=https://mnu-events.vercel.app
   ```
3. Railway automatically redeploys

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
EMAIL_VERIFICATION_SECRET=your_email_verification_secret

# CORS
CORS_ORIGIN=https://your-frontend-url.vercel.app

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Payment
PAYMENT_SECRET=your_payment_secret

# Environment
NODE_ENV=production
PORT=3001
```

### Frontend (.env)

```bash
VITE_API_URL=https://your-backend-url.up.railway.app
```

---

## Testing Verification

### Smoke Test Checklist

After deployment, verify:

- [ ] Frontend loads at Vercel URL
- [ ] Registration works (create test student account)
- [ ] Login works
- [ ] Event creation works (for organizers)
- [ ] Event listing displays
- [ ] Event registration works
- [ ] QR code generation works
- [ ] Check-in functionality works

### Create Test Data

1. Create 3-5 test events
2. Register as different user roles
3. Test event check-in flow
4. Verify gamification points

### Performance Check

- [ ] Frontend loads in < 3 seconds
- [ ] API responses < 500ms
- [ ] Database queries optimized
- [ ] No console errors

---

## Troubleshooting

### Backend Not Starting

**Problem:** Railway deployment fails

**Solution:**
```bash
# Check logs: Railway Dashboard → Deployments → View Logs
# Common issues:
# 1. Missing DATABASE_URL → Add PostgreSQL service
# 2. Database schema not created → Check Prisma logs
# 3. Wrong port → Ensure code uses process.env.PORT
```

### CORS Errors

**Problem:** Frontend can't connect to backend

**Solution:**
```bash
# 1. Verify CORS_ORIGIN in Railway matches Vercel URL exactly
# 2. Verify VITE_API_URL in Vercel is correct (no trailing slash)
# 3. Check backend is running: open https://backend-url/api/docs
```

### Database Migration Failed

**Problem:** "Table does not exist" errors

**Solution:**
```bash
# The Dockerfile uses db push which should handle this
# If issues persist, check Railway logs for Prisma errors
# Schema is pushed directly from schema.prisma file
```

### Environment Variables Not Loading

**Problem:** Config values are undefined

**Solution:**
1. Verify all required variables are set in Railway/Vercel
2. Redeploy after adding new variables
3. Check variable names match exactly (case-sensitive)

---

## Post-Deployment

### Initial Setup

1. **Create Admin Account:**
   - Register through frontend
   - Manually update role in database to `ADMIN`

2. **Add Test Events:**
   - Create sample events for testing
   - Test all event types (free, paid, internal, external)

3. **Configure Platform Settings:**
   - Set gamification rules
   - Configure CSI categories
   - Set up payment integration

### Monitoring

- Monitor Railway usage (free tier has limits)
- Check error logs regularly
- Monitor database size
- Track API response times

### Scaling Considerations

**When to upgrade:**
- More than 50-100 concurrent users
- Database > 1GB
- Need more than 512MB RAM

**Upgrade path:**
- Railway: Scale to Hobby plan ($5-10/month)
- Consider dedicated database hosting
- Add Redis for caching if needed

### Security Checklist

Before going to production:
- [ ] Change all default secrets
- [ ] Enable rate limiting
- [ ] Set up HTTPS (automatic with Railway/Vercel)
- [ ] Configure backup strategy
- [ ] Set up error tracking (Sentry)
- [ ] Enable audit logging

---

## Cost Estimates

### Free Tier (Suitable for Demo/Testing)

**Railway:**
- $5 free credit/month
- 512MB RAM
- 1GB PostgreSQL storage
- Good for 20-50 users

**Vercel:**
- Unlimited deployments
- 100GB bandwidth/month
- Automatic SSL
- Custom domains

### Production Tier

**Railway Hobby ($5-10/month):**
- More resources
- Better uptime
- Priority support

**Vercel Pro ($20/month):**
- Team features
- Analytics
- Preview deployments

---

## Migration to University Infrastructure

When ready to transfer to university hosting:

1. **Export Database:**
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Update Environment Variables:**
   - New database URL
   - New CORS origins
   - New SMTP settings

3. **Transfer Repository:**
   - Create university GitHub organization
   - Transfer repository ownership
   - Update deployment webhooks

4. **Documentation:**
   - Provide access credentials
   - Document custom configurations
   - Schedule training session

---

## Support & Resources

- **GitHub Repository:** https://github.com/your-username/mnu_events_production
- **Railway Documentation:** https://docs.railway.app
- **Vercel Documentation:** https://vercel.com/docs
- **Prisma Documentation:** https://www.prisma.io/docs

---

## Quick Reference Commands

```bash
# Generate secrets
openssl rand -base64 48

# Local development
docker-compose up -d
cd backend && npm run start:dev
cd frontend && npm run dev

# Database migrations (local)
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# View Railway logs
railway logs --service backend

# Redeploy on Railway
git push origin main
```

---

**Deployment Status:** ✅ Production Ready

*This deployment guide is designed for the MNU Events Platform. For local development setup, see [DEVELOPMENT.md](./DEVELOPMENT.md).*
