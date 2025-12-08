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
├── admin/           # Dashboard, users, events, partners, pricing, advertisements
├── auth/            # Login, verify-email
├── clubs/           # Clubs, club details
├── events/          # Events (infinite scroll), details, create, edit
├── home/            # HeroSlider, EventsHorizontalScroll
├── moderator/       # Moderator dashboard, queue
├── organizer/       # Organizer dashboard, scanner, analytics
├── partner/         # Partner dashboard
├── payments/        # Ticket purchase, status, mock payment
├── services/        # Marketplace (moved from HomePage)
└── student/         # Profile, registrations, CSI dashboard
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
import { useInfiniteEvents } from '@/hooks'; // ⭐ NEW - Infinite scroll
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

## 📚 Documentation Map

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `README.md` | Project overview, deployment | Quick start, deployment URLs |
| `DEVELOPMENT.md` | Setup, commands, testing | Development workflow |
| `PROJECT_STATUS.md` | Full status, roadmap | Feature status, metrics |
| `docs/QR_CHECKIN_SYSTEM.md` | QR system details | Check-in implementation |
| `docs/DEPLOYMENT_GUIDE.md` | Deployment instructions | Production deployment |
| `docs/TROUBLESHOOTING.md` | Common issues | Bug fixing |

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

### Advertisement System Redesign (2025-12-08)
- ✅ **Admin-only ads** - removed public ad posting, now managed via `/admin/advertisements`
- ✅ **Removed** "Post Ad" buttons from MarketplacePage, ServicesPage, MarketplaceSection
- ✅ **Removed** public `/advertisements/create` route
- ✅ **Removed** mock ads from EventsPage
- ✅ **Added** `AdminAdvertisementsPage.jsx` with full CRUD
- ✅ **Workflow:** Company → WhatsApp → Marketing → Admin → Ad on homepage

---

## Deployment Info

| Service | Platform | URL |
|---------|----------|-----|
| **Frontend** | Vercel | https://mnu-events-production.vercel.app |
| **Backend API** | Railway | https://mnueventsproduction-production.up.railway.app |
| **Database** | Railway (PostgreSQL) | Internal connection |
| **Email** | SMTP2GO | Transactional emails |

**Deploy commands:**
```bash
# Frontend (Vercel) - auto-deploys on push to main
git push origin main

# Backend (Railway) - auto-deploys on push, or manually:
railway up
```

---

*Last Updated: 2025-12-08 | v5.4 (Ad System Redesign)*

