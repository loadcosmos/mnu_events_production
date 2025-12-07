# MNU Events Platform - Agent Context

## Stack & Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | NestJS 10 + Prisma + PostgreSQL | REST API with JWT auth |
| **Frontend** | React 19 + Vite 7 + Tailwind | SPA with glassmorphism UI |
| **Auth** | JWT + RBAC | Roles: STUDENT, ORGANIZER, MODERATOR, ADMIN, EXTERNAL_PARTNER |
| **Deploy** | Railway (backend) + Vercel (frontend) | Separate CI/CD pipelines |

**Architecture Goal:** University events platform with moderation, monetization, and gamification systems.

---

## Command Cheat Sheet

```bash
# Quick Start
./start.sh                              # Start both services

# Backend (cd backend/)
npm run start:dev                       # Dev server (port 3001)
npm run build                           # Production build
npm test                                # Unit tests
npm run lint                            # ESLint
npx prisma migrate dev --name <desc>    # DB migration
npx prisma studio                       # DB GUI

# Frontend (cd frontend/)
npm run dev                             # Dev server (port 5173)
npm run build                           # Production build

# Docker
docker-compose up -d postgres           # DB only
docker-compose up -d                    # All services
```

---

## Key Paths

| Purpose | Backend | Frontend |
|---------|---------|----------|
| **Utilities** | `src/common/utils/` | `js/utils/` |
| **Constants** | `src/common/constants/` | `js/utils/` |
| **Entry** | `src/main.ts` | `js/App.jsx` |
| **Schema** | `prisma/schema.prisma` | - |

---

## Access Points

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001/api
- **Swagger:** http://localhost:3001/api/docs

**Test Accounts:** `admin@kazguu.kz`, `organizer@kazguu.kz`, `student1@kazguu.kz` (all: `Password123!`)

---

## MCP Tools (Use These!)

```
# Railway
mcp__railway-mcp-server__list-deployments  → Check deploy status
mcp__railway-mcp-server__get-logs          → Get build/deploy logs

# Vercel  
mcp__vercel-mnu-events__list_deployments   → Check deploy status
mcp__vercel-mnu-events__get_deployment_build_logs → Get build logs
```

**Always:** Check deployment status after `git push`. Never assume success.

---

## Documentation Rules

1. **Read `docs/` first** before analyzing code
2. **Update docs after every significant change** (bug fix, deploy, migration)
3. **Doc naming:** `docs/[COMPONENT]_[ISSUE]_FIX.md` or `docs/[FEATURE]_IMPLEMENTATION.md`

**Key Docs:**
- `docs/QR_CHECKIN_SYSTEM.md` - Complete check-in system (1000+ lines)
- `docs/DATA_MIGRATION_GUIDE.md` - Migration best practices

---

## Quick Reference

**Imports:**
```typescript
// Backend utilities
import { validatePagination, createPaginatedResponse } from '../common/utils';
import { determineCheckInMode } from '../common/utils/checkin-mode.utils';

// Frontend utilities
import { ROLES, formatDate, getCategoryColor } from '@/utils';
```

**Role Guard Pattern:**
```typescript
@Roles(ROLES.MODERATOR, ROLES.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async someMethod() { ... }
```

---

## Detailed References

For detailed information, see:
- **Setup/Install:** `SETUP.md`
- **Development Guide:** `DEVELOPMENT.md`  
- **Status/Roadmap:** `PROJECT_STATUS.md`
- **Feature Details:** `docs/*.md`
- **Testing Protocols:** `agent_docs/TESTING.md` *(if complex testing needed)*

---

*Last Updated: 2025-12-08 | v5.0 (Context Optimized)*
