# MNU Events Platform - Agent Context

## Stack & Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | NestJS 10 + Prisma + PostgreSQL | REST API with JWT auth |
| **Frontend** | React 19 + Vite 7 + Tailwind + React Query | SPA with glassmorphism UI |
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
```

---

## Key Paths

| Purpose | Backend | Frontend |
|---------|---------|----------|
| **Utilities** | `src/common/utils/` | `js/utils/` |
| **Services** | `src/*/` modules | `js/services/` |
| **React Query Hooks** | - | `js/hooks/` ⭐ NEW |
| **Pages** | - | `js/pages/{category}/` ⭐ REORGANIZED |
| **Entry** | `src/main.ts` | `js/App.jsx` |
| **Schema** | `prisma/schema.prisma` | - |

### Frontend Pages Structure (Reorganized 2025-12-08)
```
js/pages/
├── admin/           # Admin dashboard, users, events, partners, pricing
├── auth/            # Login, verify-email
├── clubs/           # Clubs, club details
├── events/          # Events, details, create, edit
├── home/            # HeroSlider, MarketplaceSection, EventsHorizontalScroll
├── moderator/       # Moderator dashboard, queue
├── organizer/       # Organizer dashboard, scanner, analytics
├── partner/         # Partner dashboard
├── payments/        # Ticket purchase, status, mock payment
├── services/        # Marketplace, service details, create
├── student/         # Profile, registrations, CSI dashboard
└── advertisements/  # Create advertisement
```

---

## Access Points

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001/api
- **Swagger:** http://localhost:3001/api/docs

---

## MCP Tools (Use These!)

```bash
# Railway
mcp__railway-mcp-server__list-deployments  # Check deploy status
mcp__railway-mcp-server__get-logs          # Get build/deploy logs

# Context7 (Documentation)
mcp__context7__resolve-library-id          # Find library docs
mcp__context7__get-library-docs            # Get library documentation
```

**Always:** Check deployment status after `git push`. Never assume success.

---

## React Query Integration (Added 2025-12-08)

**Setup:** `QueryClientProvider` wraps `<App />` in `main.jsx`

**Available Hooks:**
```javascript
// js/hooks/
import { useEvents, useEvent, useCreateEvent } from '@/hooks';
import { useServices, useService } from '@/hooks';
import { useCurrentUser, useUpdateProfile } from '@/hooks';
```

**Benefits:**
- Automatic caching (5 min stale time)
- Request deduplication
- Background refetching
- Simplified data fetching code

---

## Quick Reference

**Imports:**
```typescript
// Backend utilities
import { validatePagination, createPaginatedResponse } from '../common/utils';
import { determineCheckInMode } from '../common/utils/checkin-mode.utils';

// Frontend utilities
import { formatDate, getCategoryColor } from '@/utils';

// Frontend React Query hooks
import { useEvents, useServices } from '@/hooks';
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

---

## Recent Changes (2025-12-08)

### Code Architecture
- ✅ **React Query** added for API caching (`@tanstack/react-query`)
- ✅ **Hooks directory** created with `useEvents`, `useServices`, `useClubs`, `useUser`
- ✅ **Pages reorganized** from flat to categorical structure (12 folders)
- ✅ **HomePage refactored** from 1076 to 280 lines
- ✅ **EventsPage migrated** to React Query with debounced search
- ✅ **ClubsPage migrated** to React Query with filters
- ✅ **ErrorBoundary** added for graceful error handling
- ✅ **HomePageNew.jsx removed** (legacy file)
- ✅ **Barrel exports** added for services (`js/services/index.js`)

---

*Last Updated: 2025-12-08 | v5.2 (React Query + ErrorBoundary)*

