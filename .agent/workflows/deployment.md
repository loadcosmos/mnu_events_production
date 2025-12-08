---
description: How to deploy and troubleshoot Railway and Vercel deployments
---

# Deployment Workflow

## Architecture
- **Frontend**: Vercel (auto-deploys from GitHub)
- **Backend**: Railway (auto-deploys from GitHub)
- **Database**: PostgreSQL on Railway
- **Image Storage**: Cloudinary
- **Cache**: Redis on Upstash

## Deploy Process

### Automatic Deployment
1. Commit changes: `git add -A && git commit -m "description"`
2. Push: `git push origin main`
3. Both Vercel and Railway auto-deploy

### Check Deployment Status

#### Railway Backend
```bash
# List recent deployments
mcp_list-deployments --workspacePath /home/loadcosmos/mnu_events_production --json true --limit 5

# Get deployment logs
mcp_get-logs --workspacePath /home/loadcosmos/mnu_events_production --logType deploy --lines 50
```

#### Vercel Frontend
- Check Vercel dashboard or GitHub Actions

## Common Issues

### Railway: "Can't reach database server"
**Cause**: PostgreSQL not running or not yet ready

**Solution**:
1. Check Railway Dashboard → Postgres service status
2. If "Sleeping" → Click to wake it up
3. Dockerfile has retry logic (waits up to 60 seconds)

### Railway: Build succeeds but CRASHED status
**Cause**: Runtime error, usually database connection

**Solution**:
1. Check deployment logs with `mcp_get-logs`
2. Verify DATABASE_URL is set correctly
3. Check if Postgres is running

### Vercel: Module not found
**Cause**: Package installed in root but not in `frontend/package.json`

**Solution**:
```bash
cd frontend && npm install <package-name>
git add -A && git commit -m "fix: Add package to frontend" && git push
```

### 401/CSRF errors after deploy
**Cause**: CORS or cookie settings misconfigured

**Check**:
1. `CORS_ORIGIN` in Railway includes Vercel domain
2. Frontend `VITE_API_URL` points to Railway backend

## Manual Redeploy

### Railway
1. Go to Railway Dashboard → Project → Service
2. Click latest deployment → "Redeploy"

### Vercel
1. Go to Vercel Dashboard → Project
2. Click "Redeploy"

## Rollback
// turbo-all

### Railway
1. Find previous working deployment in list
2. Click → "Rollback to this deployment"

### Vercel
1. Find previous production deployment
2. Click → "Promote to Production"
