# Setup & Installation Guide

Complete guide for setting up the MNU Events Platform for development and deployment.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [System Requirements](#system-requirements)
- [Local Installation](#local-installation)
- [Docker Setup](#docker-setup)
- [Environment Configuration](#environment-configuration)
- [Database Operations](#database-operations)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Automated Startup (Recommended)

```bash
chmod +x start.sh
./start.sh
```

This script handles:
- ✅ Database startup
- ✅ Backend dependencies & Prisma setup
- ✅ Database migrations and seeding
- ✅ Frontend and backend server startup

### Manual Startup

**Terminal 1: Database**
```bash
docker-compose up -d postgres
```

**Terminal 2: Backend**
```bash
cd backend
npm install
npm rebuild bcrypt          # Required for WSL
npx prisma migrate dev      # Apply migrations
npx prisma generate         # Generate Prisma client
npx prisma db seed          # Seed test data
npm run start:dev           # Start dev server
```

**Terminal 3: Frontend**
```bash
npm install
npm run dev
```

---

## 📦 System Requirements

### Required Software

- **Node.js:** 20+ (20.11.0 or newer)
- **npm:** 10+ (included with Node.js)
- **Docker & Docker Compose:** Latest version
- **Git:** For version control
- **WSL 2:** Required for Windows users

### Recommended System Resources

- **RAM:** 8GB minimum (12GB+ recommended)
- **Disk Space:** 10GB free
- **CPU Cores:** 4+ cores recommended

### Platform-Specific Prerequisites

**Windows:**
1. Install WSL 2: `wsl --install`
2. Install Docker Desktop with WSL 2 backend
3. Set WSL 2 as default: `wsl --set-default-version 2`

**macOS & Linux:**
- Docker Desktop (macOS) or Docker Engine (Linux)
- No special configuration needed

---

## 💻 Local Installation

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd mnu_events
```

### Step 2: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# WSL users: rebuild bcrypt for Linux compatibility
npm rebuild bcrypt
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit if needed (defaults work for local development)
# nano backend/.env
```

### Step 4: Database Setup

```bash
cd backend

# Start PostgreSQL container
docker-compose up -d postgres

# Wait for database to be ready (~5 seconds)
sleep 5

# Apply migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed with test data
npx prisma db seed
```

### Step 5: Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend (from root directory)
npm run dev
```

### Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **API Documentation:** http://localhost:3001/api/docs
- **Prisma Studio:** `npm run prisma:studio` (from backend/)

---

## 🐳 Docker Setup

### Overview

Docker provides a consistent development environment with:
- ✅ No local Node.js/PostgreSQL installation needed
- ✅ Identical environment across all developers
- ✅ One command to start everything
- ✅ Easy cleanup and reset

### Architecture

```
┌─────────────────────────────────────────────┐
│           User's Browser                    │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
    v http:3000                   v http:3001

┌─────────────────────┐    ┌──────────────────┐
│ Frontend Container  │    │ Backend Container │
│ (React + Vite)      │    │ (NestJS + Prisma)│
│ Nginx:80            │    │ Port: 3001       │
│ Port: 3000          │    │                  │
└─────────────────────┘    │    ┌────────────┐│
                           │    │ PostgreSQL ││
                           │    │ Port: 5432 ││
                           │    └────────────┘│
                           └──────────────────┘
```

### Docker Compose Commands

**Start Services**
```bash
# Start all services (detached)
docker-compose up -d

# Start with live logs
docker-compose up

# Rebuild and start (after code changes)
docker-compose up --build -d
```

**Stop Services**
```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove volumes (deletes database)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

**Manage Database**
```bash
# Apply migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed

# Reset database (deletes all data)
docker-compose exec backend npx prisma migrate reset

# Open Prisma Studio (GUI)
docker-compose exec backend npx prisma studio
# Visit: http://localhost:5555
```

**Troubleshooting Commands**
```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend

# Check service status
docker-compose ps

# Access container shell
docker-compose exec backend sh

# Check resource usage
docker stats
```

### Common Docker Issues

**Port Already in Use**
```bash
# Find process using port (Linux/macOS)
lsof -i :3000

# Find process using port (Windows)
netstat -ano | findstr :3000

# Change ports in docker-compose.yml if needed
```

**Database Connection Error**
```bash
# Restart database container
docker-compose restart postgres

# Check database logs
docker-compose logs postgres

# Verify connection string in backend/.env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/mnu_events"
```

**Build Failures**
```bash
# Clean rebuild
docker-compose build --no-cache

# Remove old images
docker image prune -a

# Rebuild everything
docker-compose up --build -d
```

---

## 🔐 Environment Configuration

### Backend `.env` File

Create `backend/.env` (copy from `backend/.env.example`):

**Database Configuration**
```bash
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/mnu_events"
```

**Server Configuration**
```bash
PORT=3001
NODE_ENV=development
```

**Authentication**
```bash
JWT_SECRET=your-secret-key-change-in-production
REFRESH_TOKEN_SECRET=your-refresh-secret-change-in-production
EMAIL_VERIFICATION_SECRET=your-verification-secret-change-in-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

**SMTP Configuration (Optional)**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**API Configuration**
```bash
API_PREFIX=api
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment

Create `frontend/.env` (optional, defaults to localhost:3001):

```bash
VITE_API_URL=http://localhost:3001/api
```

### Security Best Practices

⚠️ **CRITICAL:**
- Never commit `.env` files to version control
- Never use example secrets in production
- Generate random, strong secrets (32+ characters)
- Use secrets management tools (AWS Secrets Manager, HashiCorp Vault)

---

## 🗄️ Database Operations

### Prisma Migrations

**Create New Migration**
```bash
cd backend

# Create named migration
npx prisma migrate dev --name add-new-feature

# Apply migration (with preview)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Create migration without applying
npx prisma migrate create --name feature-name
```

**Database Schema**

Edit `backend/prisma/schema.prisma` to modify schema:

```prisma
// Example: Add new model
model Feature {
  id        String   @id @default(cuid())
  name      String
  enabled   Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([enabled])
}
```

Then create migration:
```bash
npx prisma migrate dev --name add-feature-model
```

### Database Seeding

Seed file: `backend/prisma/seed.ts`

**Run Seed**
```bash
npx prisma db seed
```

**Important Notes:**
- Seed data uses test credentials: `admin@kazguu.kz` / `Password123!`
- Seed is idempotent (safe to run multiple times)
- Modify seed.ts to change test data

### Prisma Studio (GUI)

Interactive database viewer and editor:

```bash
cd backend
npx prisma studio

# Open http://localhost:5555 in browser
```

---

## 🔄 Migration Guide

### Overview of Changes

The codebase includes refactored utilities and best practices:
- 🔒 Security fixes
- 🏗️ Shared utilities (backend & frontend)
- ⚡ Database performance optimizations
- 📚 Official NestJS/Prisma/React patterns

### Applying Refactored Codebase

**Step 1: Pull Latest Code**
```bash
git pull origin main
npm install
cd backend && npm install
```

**Step 2: Apply Database Indexes**
```bash
cd backend

# Apply new indexes migration
npx prisma migrate dev --name add-performance-indexes

# Regenerate Prisma Client
npx prisma generate

# Restart backend
npm run start:dev
```

### Backend Code Migration Examples

**Before: Duplicate Pagination Logic**
```typescript
async findAll(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    this.prisma.event.findMany({ skip, take: limit }),
    this.prisma.event.count()
  ]);

  return {
    data: items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}
```

**After: Using Shared Utilities**
```typescript
import { validatePagination, createPaginatedResponse } from '../common/utils';

async findAll(page?: number, limit?: number) {
  const { skip, take, page: validatedPage } = validatePagination({ page, limit });

  const [items, total] = await Promise.all([
    this.prisma.event.findMany({ skip, take }),
    this.prisma.event.count()
  ]);

  return createPaginatedResponse(items, total, validatedPage, take);
}
```

### Frontend Code Migration Examples

**Before: Hardcoded Values**
```javascript
if (user.role === 'ADMIN') { ... }
const formatted = new Date(event.startDate).toLocaleDateString('en-US', {...});
const color = event.category === 'TECH' ? 'bg-gray-100' : 'bg-blue-100';
const message = error.response?.data?.message || error.message || 'Error';
```

**After: Using Utilities**
```javascript
import { ROLES, formatDate, getCategoryColor, extractErrorMessage } from '@/utils';

if (user.role === ROLES.ADMIN) { ... }
const formatted = formatDate(event.startDate);
const color = getCategoryColor(event.category);
const message = extractErrorMessage(error, 'Failed to load events');
```

### Verify Migration

**Test Backend Compilation**
```bash
cd backend
npm run build
# Should have no TypeScript errors (strict mode enabled)
```

**Test Frontend Build**
```bash
npm run build
# Should complete successfully
```

**Run Tests**
```bash
cd backend
npm test
# All tests should pass
```

### No Breaking Changes! 🎉

All changes are **backward compatible**. Existing code continues to work without modifications. New utilities are additive.

**Going Forward:**
- New services should use utilities from `common/utils`
- New components should use `@/utils` for constants and helpers
- Avoid creating duplicate code - check if utility exists first

---

## 🆘 Troubleshooting

### Common Issues

**Node.js Version Error**
```bash
# Check your Node version
node --version

# Install nvm (Node Version Manager) if needed
# Then install Node 20+
nvm install 20
nvm use 20
```

**bcrypt Installation Fails (WSL)**
```bash
cd backend
npm rebuild bcrypt
```

**Cannot Find Module Errors**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Database Connection Refused**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for startup
sleep 5

# Check connection
npm run prisma:generate
```

**TypeScript Strict Mode Errors**
```bash
cd backend

# Fix type errors in code, or temporarily disable strict mode
# Edit tsconfig.json and change "strict": false
npm run build
```

**Prisma Migration Conflicts**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix-schema
npx prisma db seed
```

**Port Already in Use**
```bash
# Change port in docker-compose.yml or kill process
# macOS/Linux:
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Frontend Hot Reload Not Working**
```bash
# Clear Vite cache and node_modules
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Docker Issues on Windows**
```powershell
# Update WSL
wsl --update

# Shutdown and restart WSL
wsl --shutdown

# Restart Docker Desktop
```

---

## 📚 Additional Resources

- **CLAUDE.md** - Development guidelines and best practices
- **PROJECT_STATUS.md** - Current project status and roadmap
- **DEVELOPMENT.md** - Development tools and checklists
- **Docker Documentation** - https://docs.docker.com/
- **Prisma Documentation** - https://www.prisma.io/docs
- **NestJS Documentation** - https://docs.nestjs.com/
- **React Documentation** - https://react.dev/

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] `npm run build` compiles without errors
- [ ] `npm test` passes all tests
- [ ] Frontend loads at http://localhost:5173
- [ ] Backend API responds at http://localhost:3001/api
- [ ] Can log in with test credentials
- [ ] Database operations work (create, read, update, delete)
- [ ] No console errors in browser dev tools

---

**Last Updated:** 2025-11-18
**Version:** 2.0 (Consolidated Setup Guide)
