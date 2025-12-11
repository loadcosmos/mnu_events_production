# MNU Events Platform - Agent Context

## Stack & Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | NestJS 10 + Prisma + PostgreSQL | REST API with JWT auth |
| **Frontend** | React 19 + Vite 7 + Tailwind + React Query | SPA with glassmorphism UI |
| **Auth** | JWT + RBAC | Roles: STUDENT, ORGANIZER, MODERATOR, ADMIN, EXTERNAL_PARTNER |
| **Deploy** | **Railway** (Backend+DB) + **Vercel** (Frontend) | **Primary Environment**. Local dev may use remote DB. |

**Architecture Goal:** University events platform with moderation, monetization, and gamification systems.

**⚠️ IMPORTANT:**
- **Logs:** `Connection reset by peer` in Postgres logs usually means the Railway DB (Free/Hobby tier) is sleeping or restarting. Check Railway Dashboard.
- **Local Dev:** Ensure `.env` points to the correct Railway URL if testing against the live backend.
- **🚨 CRITICAL SAFETY RULE:** **NEVER** run `prisma migrate reset` or any destructive database command on the remote Railway/Production database without explicit, written confirmation from the user. This action deletes all data, including manual user accounts and content. Always check if Important Data exists before seeding.

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

## Recent Changes (2025-12-11)

### Community & Announcements UI Redesign 🎨 LATEST (2025-12-11)

**Problem:** Community page used confusing tabs, Announcements on homepage were too compact (3-column grid), OFFICIAL posts not visually distinguished.

**Solution:** Complete UI/UX overhaul following Twitter/Facebook patterns:

#### 1. NewsFeedSection - Announcements Grid
**File:** `frontend/js/pages/home/NewsFeedSection.jsx`
- ✅ **Layout:** Changed to 2-column Grid with bottom blur effect ("Show More" peek)
- ✅ **Title:** Renamed "Latest News" to "Announcements"
- ✅ **OFFICIAL Badge:** Red "🎓 OFFICIAL" badge for Faculty updates
- ✅ **Visuals:** Liquid glass cards, hover effects, smooth gradients
- ✅ **Limit:** Showing 6 posts (1 row fully visible, others blurred)

**Result:**
```
[Announcement 1]  [Announcement 2]
[    ...       ]  [    ...       ]
          Show More ->
```

#### 2. PostCard - OFFICIAL Post Styling
**File:** `frontend/js/components/posts/PostCard.jsx`
- ✅ **OFFICIAL Badge:** Red "🎓 OFFICIAL" badge for FACULTY_POST/ANNOUNCEMENT
- ✅ **Left Border:** `border-l-4 border-[#d62e1f]` for visual distinction
- ✅ **Removed:** Old "Announcement" badge (replaced with unified OFFICIAL badge)

#### 3. CommunityPage - Smart Filters by Role
**File:** `frontend/js/pages/community/CommunityPage.jsx`
- ✅ **Removed Tabs:** Replaced `Tabs` component with simple filter buttons
- ✅ **Role-based Filters:** Filter buttons visible ONLY for STUDENT role
- ✅ **Filter Options:** All / Official (🎓) / Students (👥)
- ✅ **Post Visibility Logic:**

| Role | Sees | Filters |
|------|------|---------|
| **STUDENT** | FACULTY + STUDENT posts | ✅ Yes (All/Official/Students) |
| **FACULTY** | FACULTY posts only | ❌ No (auto-filtered) |
| **ADMIN/MODERATOR** | All posts | ❌ No (sort only) |
| **EXTERNAL_PARTNER** | Nothing (🔒 blocked) | ❌ No |

**Files Modified:**
- `frontend/js/pages/home/NewsFeedSection.jsx` - Twitter-style horizontal cards
- `frontend/js/components/posts/PostCard.jsx` - OFFICIAL badge + red border
- `frontend/js/pages/community/CommunityPage.jsx` - Role-based filtering

**Benefits:**
- 📱 **Better UX:** Twitter/Facebook-style feed more familiar to users
- 🎯 **Role Clarity:** OFFICIAL posts clearly distinguished with badge + border
- 🔍 **Smart Filters:** Students get granular control, Faculty auto-filtered
- 🚀 **Performance:** Same React Query caching, now with better UI

---

### Critical Bug Fixes (Session & Preferences) 🔧

**Problem 1: Session expiry doesn't update UI**
- ✅ **Auto-logout fix:** When JWT expires (401 Unauthorized), user data now cleared from localStorage
- ✅ **UI update:** Header now shows "Login" button instead of username after session expires
- ✅ **File modified:** `frontend/js/services/apiClient.js:138` - Added `localStorage.removeItem('user')`

**Problem 2: Onboarding preferences not saving correctly**
- ✅ **Root cause:** OnboardingModal and EditInterestsSection used **different constants**
  - OnboardingModal: `CREATIVITY`, `SERVICE`, `INTELLIGENCE` (correct ✅)
  - EditInterestsSection: `universiade`, `culture`, `sport`... (wrong ❌)
  - Result: User selections in onboarding didn't match profile checks → nothing displayed
- ✅ **Solution:** Created shared `constants/preferences.js` with canonical values
- ✅ **CSI Categories:** Restored correct 3 categories matching backend Prisma schema
  - `CREATIVITY` 🎨, `SERVICE` 🤝, `INTELLIGENCE` 🧠
- ✅ **Event Categories:** 7 categories including `TECH` (backend supports it)
  - `ACADEMIC`, `SPORTS`, `CULTURAL`, `TECH`, `SOCIAL`, `CAREER`, `OTHER`

**Files Created:**
- `frontend/js/constants/preferences.js` - Shared preferences constants (matching Prisma enums)

**Files Modified:**
- `frontend/js/services/apiClient.js` - Clear localStorage on 401
- `frontend/js/components/OnboardingModal.jsx` - Import shared constants
- `frontend/js/components/profile/EditInterestsSection.jsx` - Import shared constants

**Backend Schema Reference:**
```prisma
enum Category { ACADEMIC, SPORTS, CULTURAL, TECH, SOCIAL, CAREER, OTHER }
enum CsiCategory { CREATIVITY, SERVICE, INTELLIGENCE }
enum AvailableDay { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }
enum TimeSlot { MORNING, AFTERNOON, EVENING }
```

---

### Performance Optimizations ⚡

**Backend (Redis + Prisma):**
- ✅ **Recommendations caching:** `GET /events/recommendations` cached in Redis (10 min TTL)
- ✅ **Trending events:** `GET /events/trending` cached in Redis (5 min TTL)
- ✅ **N+1 fix in moderation:** `getQueue()` now batches DB queries (N → 3 queries max)
- ✅ **Prisma logging:** Slow queries (>100ms) logged in dev mode
- ✅ **Cache invalidation:** Preferences update clears user's recommendations cache

**Frontend (React):**
- ✅ **memo():** `PostCard`, `ServiceCard`, `EventCard`, `SavedEventCard`, `BottomNavigation`, `EventModal`
- ✅ **React Query:** staleTime=5min, gcTime=10min, automatic deduplication
- ✅ **useTransition:** Filters on EventsPage for non-blocking UI
- ✅ **useDeferredValue:** Search debouncing

**Cache Keys (Redis):**
```
recommendations:{userId}:{limit}  # 10 min TTL
events:trending:{limit}            # 5 min TTL
blacklist:{token}                  # JWT expiration TTL
```

---

## UI/UX Improvement Plan - Phase 2 Complete ✅
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
- `frontend/js/components/SavedEventCard.jsx` - Complete rewrite to single-line layout + memo + click fix
- `frontend/js/components/ImageUploadCrop.jsx` - Simplified drag-n-drop mode (no preview box, no "Upload Image" text)
- `frontend/css/globals.css` - Mobile performance optimizations

#### Bug Fixes (Phase 1)
- ✅ **SavedEventCard links** - Fixed click handling with `e.stopPropagation()` on unsave button
- ✅ **ImageUploadCrop UI** - Removed cluttered preview box and text when used in drag-n-drop mode (CreatePostModal)

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


## 🐛 Troubleshooting & Critical Rules

### 1. "s is not a function" (Minified Error)
**Cause:** Stale Vercel deployment serving old JS bundles, or component passing `undefined` as a function prop.
**Fixes:**
- **Force Redeploy:** `vercel --prod --force` to clear Vercel build cache.
- **Cache Headers:** Ensure `vercel.json` has `no-cache` for `index.html` and `immutable` for `/assets/`.
- **Code Guard:** ALWAYS check if function exists before calling: `const handleClick = () => onClick && onClick(id);`

### 2. Railway Database Connection Failed
**Error:** `Connection reset by peer` or `Database not ready`
**Cause:** Free tier database "sleeps" or crashes.
**Fix:**
1. Check Railway Dashboard -> Postgres -> Status.
2. If crashed, click **Restart** or **Redeploy**.
3. **Wait 1 min** for DB to recover.
4. Restart Backend service if it doesn't auto-reconnect.

### 3. Vercel Caching Strategy (Critical)
We use `vercel.json` to control caching/
- `index.html`: `no-cache, no-store, must-revalidate` (Always fresh)
- `/assets/*`: `public, max-age=31536000, immutable` (Cached forever, unique hashes)
**Do not remove these headers from vercel.json.**

### 4. Safe Coding Practices
- **Event Handlers:** Never assume `onClick`, `onSave`, etc. are provided. Always default to no-op or check existence.
- **Mobile First:** Sidebar width must be `max-w-[85vw]` to prevent overflow.
- **Auto-Imports:** Check paths! `../utils/dateFormatters` vs `../../utils`.

---

*Last Updated: 2025-12-11 | v5.9 (Session & Preferences Fixes)*


