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

## React Query Integration (Added 2025-12-08, Extended 2025-12-09)

**Setup:** `QueryClientProvider` wraps `<App />` in `main.jsx`

**Available Hooks:**
```javascript
// js/hooks/
import { useEvents, useEvent, useCreateEvent, useInfiniteEvents } from '@/hooks';
import { useServices, useService } from '@/hooks';
import { useClubs, useClub } from '@/hooks';
import { useCurrentUser, useUpdateProfile } from '@/hooks';
import { usePosts, useInfinitePosts, useMyPosts, useCreatePost, useDeletePost } from '@/hooks';
import { useSavedPosts, useSavedEvents, useToggleSavePost, useToggleSaveEvent } from '@/hooks';
import { useFollowStats, useFollowers, useFollowing, useToggleFollow } from '@/hooks'; // ⭐ NEW
```

**Benefits:**
- Automatic caching (5 min stale time)
- Request deduplication
- Background refetching
- Optimistic updates for likes, saves, follows
- Infinite scroll support

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

## Recent Changes (2025-12-10)

### UI/UX Improvement Plan - Phase 1 Complete ✅
**Reference:** `COMPREHENSIVE_UI_UX_PLAN.md`

#### CreatePostModal Enhancements
- ✅ **Character counter** - Shows "X / 1000" with amber warning at 500+ characters
- ✅ **File size badge** - Displays MB size in image preview (bottom-right corner)
- ✅ **Enhanced drag-n-drop** - Gradient hover effect with smooth transitions

#### SavedEventCard Redesign
- ✅ **Ultra-compact layout** - Rewritten from 93 lines to 55 lines (40% reduction)
- ✅ **Single-line design** - Thumbnail (16x16) + Title + Date + Unsave button in one row
- ✅ **Performance** - Added `React.memo()` for optimized re-renders
- ✅ **Space savings** - 60-70% vertical space reduction vs full EventCard

#### Performance Optimizations
- ✅ **Mobile CSS** - Reduced backdrop-filter blur on mobile (4px vs 10px) for better FPS
- ✅ **Lazy loading** - `content-visibility: auto` for images, `will-change` for hover animations
- ✅ **EventCard** - Already optimized with `React.memo`, `loading="lazy"`, `decoding="async"`

#### Files Modified
- `frontend/js/components/posts/CreatePostModal.jsx` - Character counter + file size badge + drag-n-drop styling
- `frontend/js/components/SavedEventCard.jsx` - Complete rewrite to single-line layout + memo
- `frontend/css/globals.css` - Mobile performance optimizations

---

### Critical Bug Fixes
- ✅ **Fixed saved events not persisting** - EventsPage now uses React Query hooks from `useSavedItems.js` instead of legacy useState hook
- ✅ **Community added to desktop header** - Header navigation now uses dynamic `navItems` array (Home, Events, Community, Clubs)
- ✅ **Fixed organizer navigation** - After create/edit event, organizers redirect to `/organizer` dashboard instead of public event page

### Mobile Responsiveness Improvements
- ✅ **PartnerDashboardPage** - Added `grid-cols-1` for mobile, responsive header with `flex-col md:flex-row`
- ✅ **OrganizerPage** - Smaller header font on mobile, scrollable tabs with `overflow-x-auto`
- ✅ **All sidebar layouts** (Admin, Organizer, Moderator, Partner) - Sidebar width `w-[85vw] max-w-64` prevents overflow on narrow screens
- ✅ **BottomNavigation** - Removed `scale-105` effect, added `React.memo()` for performance

### Performance & UX
- ✅ **Prevented unwanted zoom** - Added `touch-action: manipulation` in globals.css
- ✅ **Memoized BottomNavigation** - Wrapped with `React.memo()` to prevent unnecessary re-renders
- ✅ **Deleted duplicate hook** - Removed legacy `useSavedEvents.js` (useState-based), kept only `useSavedItems.js` (React Query)

### Files Modified (2025-12-10)
- `frontend/js/pages/events/EventsPage.jsx` - React Query for saved events
- `frontend/js/pages/events/CreateEventPage.jsx` - Fixed redirect logic
- `frontend/js/pages/events/EditEventPage.jsx` - Fixed redirect logic
- `frontend/js/components/Layout.jsx` - Dynamic navigation with navItems
- `frontend/js/components/BottomNavigation.jsx` - memo() + removed scale
- `frontend/js/components/AdminLayout.jsx` - Responsive sidebar
- `frontend/js/components/OrganizerLayout.jsx` - Responsive sidebar
- `frontend/js/components/ModeratorLayout.jsx` - Responsive sidebar
- `frontend/js/components/PartnerLayout.jsx` - Responsive sidebar
- `frontend/js/pages/partner/PartnerDashboardPage.jsx` - Mobile grid fixes
- `frontend/js/pages/organizer/OrganizerPage.jsx` - Mobile header + tabs
- `frontend/css/globals.css` - touch-action: manipulation

### Files Deleted (2025-12-10)
- `frontend/js/hooks/useSavedEvents.js` - Duplicate, replaced by useSavedItems.js

---

## Recent Changes (2025-12-09)

### IMPROVEMENT_PLAN.md - 100% Complete 🎉

#### High Priority (5/5)
- ✅ Backend post type filtering (`type[]` query param)
- ✅ isPinned validation (ADMIN/MODERATOR only)
- ✅ React Query hooks for posts (`usePosts.js`)
- ✅ Skeleton loading for NewsFeedSection
- ✅ Backend filtering in NewsFeedSection

#### Medium Priority (5/5)
- ✅ Saved in BottomNavigation
- ✅ `useSavedItems.js` hooks with optimistic updates
- ✅ Infinite scroll for CommunityPage
- ✅ `useFollows.js` hooks (useFollowStats, useToggleFollow)
- ✅ Pull-to-refresh for MyPostsPage

#### Low Priority (6/6)
- ✅ Image preview in CreatePostModal (FileReader API)
- ✅ Clickable FollowStats counters (`FollowersModal.jsx`)
- ✅ Search, filters, sort for CommunityPage (debounced)
- ✅ Error Boundaries (already in App.jsx)
- ✅ Relative time (already uses formatDistanceToNow)
- ✅ ProfilePage tabs (Overview, Saved, Settings)

### New Files Created (2025-12-09)
- `frontend/js/hooks/useFollows.js` - Follow system hooks
- `frontend/js/hooks/usePosts.js` - Posts hooks
- `frontend/js/hooks/useSavedItems.js` - Saved items hooks
- `frontend/js/components/profile/FollowersModal.jsx` - Followers/following modal

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

### Security Implementations (Verified 2025-12-08)
- ✅ **JWT httpOnly Cookies** - Tokens no longer in localStorage (`auth.service.ts`)
- ✅ **JWT Blacklist** - Logout invalidates tokens via Redis (`jwt-blacklist.service.ts`)
- ✅ **CSRF Protection** - Double-submit cookie pattern (`main.ts`)
- ✅ **XSS Protection** - DOMPurify sanitization on all user content (`sanitize.js`)
- ✅ **Helmet Headers** - CSP, HSTS, X-Frame-Options configured
- ✅ **Winston Logging** - Structured JSON logs in production
- ✅ **Health Checks** - `/api/health`, `/api/health/ready`, `/api/health/live`

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

*Last Updated: 2025-12-10 | v5.7 (UI/UX Phase 1 Complete + Mobile Fixes)*

