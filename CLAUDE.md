# CLAUDE.md

Quick reference and guidance for Claude Code when working with MNU Events Platform.

## ⚡ Response Style

**IMPORTANT:** Keep responses SHORT and CONCISE by default.
- Only provide detailed explanations when explicitly asked
- Use brief confirmations and summaries
- Show code/logs only when necessary
- Long responses only on user request

## 📝 Documentation Rule

**CRITICAL: Update `docs/` after EVERY significant action!**

When you complete ANY of the following:
- ✅ Fix a bug or error
- ✅ Deploy changes to production (Railway/Vercel)
- ✅ Run database seed or migrations
- ✅ Solve a problem (especially after multiple attempts)
- ✅ Configure new services or settings

**YOU MUST:**
1. Update relevant `docs/*.md` file with the solution
2. Include: problem, solution, commands used, results
3. Commit the documentation update

**Why?** When context resets, docs are the ONLY source of truth about what was done.

**Example files to update:**
- `docs/VERCEL_404_FIX.md` - Deployment issues
- `docs/RAILWAY_SETUP.md` - Railway configuration
- `docs/DATABASE_SEED.md` - Database operations
- Create new files as needed

## 🎯 Project Overview

**MNU Events Platform** - University events management system
**Status:** 99% Complete | Grade: A | Production Ready: ✅ (Beta ready, testing phase)
**Last Updated:** 2025-12-01

**Tech Stack:**
- Backend: NestJS 10 + Prisma ORM + PostgreSQL
- Frontend: React 19 + Vite 7 + Tailwind CSS + React Router v7
- Auth: JWT with role-based access control (STUDENT, ORGANIZER, ADMIN, MODERATOR, **EXTERNAL_PARTNER**)
- Design: Liquid glass (glassmorphism) + dark theme
- **New:** Monetization, Gamification, Moderation, **External Partners** systems

### 🆕 Recent Updates (2025-12-01)
- ✅ **QR Check-In System**: 4 event types (Internal/External × Free/Paid) with automatic mode detection
- ✅ **Check-in Mode Utilities**: `determineCheckInMode()` + `shouldGenerateRegistrationQR()` in `common/utils`
- ✅ **QRScanner Component**: Camera-based scanning using html5-qrcode library with dark theme support
- ✅ **MODERATOR Role**: Added to all check-in endpoints (validate-ticket, generate-event-qr, stats)
- ✅ **Unit Tests**: 11 tests for check-in mode logic with 100% coverage
- ✅ **Migration Script**: `backend/scripts/fix-checkin-modes.ts` for existing events
- ✅ **Documentation**: Complete QR system docs in `docs/QR_CHECKIN_SYSTEM.md` (1038 lines)

### Previous Updates (2025-11-28)
- ✅ **External Partners System**: COMPLETE - Full partner management with dashboard, routing, payment verification
- ✅ **Partner Payment Verification**: Partners can verify student payments (EXTERNAL_PARTNER role added to endpoints)
- ✅ **Partner Layout**: Dedicated orange-themed layout matching organizer/admin design consistency
- ✅ **Event Moderation for Partners**: Partner events go through PENDING_MODERATION queue
- ✅ **Partner Commission System**: Automatic 10% commission calculation and tracking
- ✅ **Event Limit Modal**: UI for partner event limits (2 free/month, buy slots at 3,000₸)
- ✅ **Payment Verification Roles**: ORGANIZER, EXTERNAL_PARTNER, MODERATOR, ADMIN can verify payments
- ✅ **Code Verification (Context7)**: All code verified against official NestJS, Prisma, React Router docs - 100% актуально
- ✅ **Gamification System**: COMPLETE - Points, levels, badges, achievements fully functional
- ✅ **CSI Dashboard**: Student CSI statistics with category filtering
- ✅ **Marketplace Page**: Dedicated services marketplace with advanced filters (search, category, price range)
- ✅ **More Page**: Navigation hub for tutoring, services, preparation, analytics
- ✅ **QR Check-In Enhanced**: 4-type system with automatic mode detection and conditional QR generation
- ✅ **Check-in Analytics**: Enhanced event analytics with check-in rates and CSV export
- ✅ **Club CSI Categories**: Clubs now support CSI category tagging (`csiCategories[]`)
- ✅ **Service Details API**: Full integration with ticket QR code generation

---

## 📚 Documentation Map

This repository has been reorganized with focused documentation:

| Document | Purpose | Audience |
|----------|---------|----------|
| **README.md** | Quick start & overview | Everyone |
| **PROJECT_STATUS.md** | Current status, roadmap, implementation plan | Project leads, Developers |
| **SETUP.md** | Installation & configuration | New developers |
| **DEVELOPMENT.md** | Dev tools, testing, checklists | Developers |
| **CLAUDE.md** | This file (quick reference) | Claude Code |
| **WSL_VS_WINDOWS_ANALYSIS.md** | Environment comparison | Windows users |

**⚠️ See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for detailed status, features, and implementation plan.**

---

## ⚡ Quick Start

```bash
chmod +x start.sh
./start.sh
```

Or see **SETUP.md** for detailed installation steps.

### Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/api/docs

### Test Accounts (after seed)
- Admin: `admin@kazguu.kz` / `Password123!`
- Organizer: `organizer@kazguu.kz` / `Password123!`
- Student: `student1@kazguu.kz` / `Password123!`

---

## 🆕 New Features in Development

**See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for complete roadmap**

### Phase 1-3: Moderation System (7 days)
- **MODERATOR role** - New permission level between ORGANIZER and ADMIN
- Moderation queue API endpoints
- Technical filters (100 char minimum, repetition detection)
- Content safety checks

**Key files to create:**
- `backend/src/moderation/` - New module
- `backend/prisma/schema.prisma` - Add ModerationQueue model
- `frontend/js/pages/ModeratorDashboard.jsx` - New page

### Phase 4: Monetization (12 days)
- ✅ Flexible pricing for external venues (5,000-20,000 тг) - **DONE**
- ⚠️ Advertisement system (TOP_BANNER, NATIVE_FEED, STORY_BANNER) - **Frontend ready, Backend TODO**
- ✅ Paid events with Kaspi transfer verification - **DONE**
- ✅ Premium subscription (500 тг/month) - **DONE**

**Key files completed:**
- ✅ `backend/src/pricing/` - Pricing module
- ⚠️ `backend/src/advertisements/` - Ads module **NEEDS IMPLEMENTATION**
- ✅ `backend/prisma/schema.prisma` - PricingTier, Advertisement, PremiumSubscription models added
- ✅ `frontend/js/pages/PaymentVerificationPage.jsx` - Organizer payment checks
- ✅ `frontend/js/components/AdBanner.jsx` - Advertisement UI components
- ✅ `frontend/js/services/adsService.js` - Advertisement service (graceful error handling)

### Phase 5: Gamification ✅ **COMPLETED**
- ✅ Points system (earn for attendance, participation)
- ✅ User levels: NEWCOMER, ACTIVE, LEADER, LEGEND
- ✅ Achievements system (4 types: ATTENDANCE, CATEGORY, REGULARITY, SOCIAL)
- ✅ Profile badges and progress tracking
- ✅ CSI statistics dashboard for students

**Key files implemented:**
- ✅ `backend/src/gamification/` - Fully functional module
- ✅ `backend/prisma/schema.prisma` - UserLevel, Achievement, Points models added
- ✅ `frontend/js/pages/CsiDashboardPage.jsx` - CSI statistics and progress
- ✅ Integration with check-in system for automatic point awards

### Quick Reference for New Developers:
```typescript
// Example: MODERATOR role check
import { ROLES } from '../common/constants';

@Roles(ROLES.MODERATOR, ROLES.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async getModerationQueue() { ... }
```

```javascript
// Example: Premium subscription check (frontend)
import { ROLES } from '@/utils';

const isPremium = user.subscription?.status === 'ACTIVE';
const listingLimit = isPremium ? 10 : 3;
```

---

## 🗂️ Project Structure

```
backend/src/
├── auth/          # Authentication & JWT
├── users/         # User management
├── events/        # Event management (auto checkInMode calculation)
├── registrations/ # Event registrations (conditional QR generation)
├── clubs/         # Clubs & memberships
├── payments/      # Payment processing (mock)
├── checkin/       # QR validation (MODERATOR role added)
├── services/      # Marketplace
├── analytics/     # Statistics
├── moderation/    # Content moderation (MODERATOR role)
├── pricing/       # Flexible pricing for external venues
├── advertisements/# Advertisement system
├── gamification/  # Points, levels, achievements
├── common/        # 🌟 Shared utilities & constants
│   └── utils/     # ⭐ checkin-mode.utils.ts (new)
├── prisma/        # Database service
├── scripts/       # 🆕 Migration scripts (fix-checkin-modes.ts)
└── config/        # Configuration

frontend/js/
├── components/    # Reusable UI components
│   ├── QRScanner.jsx        # 🆕 Camera-based QR scanner (html5-qrcode)
│   └── ...
├── pages/         # Route components
│   ├── MarketplacePage.jsx  # Services marketplace
│   ├── MorePage.jsx         # Additional features hub
│   ├── CsiDashboardPage.jsx # Student CSI statistics
│   ├── MyRegistrationsPage.jsx  # ⭐ Updated with conditional QR display
│   └── ...
├── services/     # API client & services
│   ├── checkinService.js    # ⭐ Updated with MODERATOR support
│   └── ...
├── context/      # React Context (auth)
├── utils/        # 🌟 Shared utilities & constants
└── App.jsx       # Routes
```

---

## 📚 Documentation-First Approach

**CRITICAL: Always check `docs/` folder first before analyzing code!**

All major features have detailed documentation in `docs/`:
- `docs/QR_CHECKIN_SYSTEM.md` - Complete QR Check-In System (1038 lines)
- Future features will also be documented here

**Workflow:**
1. ✅ **First:** Read relevant `docs/*.md` file for feature overview
2. ✅ **Then:** Read specific code files if needed for implementation details
3. ❌ **Never:** Analyze entire codebase without checking docs first

**Why?** Docs contain:
- Complete business logic and rules
- Architecture diagrams and flow charts
- API endpoints with examples
- Database schema details
- Testing scenarios and edge cases
- Migration guides and troubleshooting

⚡ This saves time and ensures accurate understanding of features!

---

## 🔄 Code Reuse Pattern

**Backend:** Use utilities from `common/utils/`:
```typescript
import { validatePagination, createPaginatedResponse, requireCreatorOrAdmin } from '../common/utils';
import { determineCheckInMode, shouldGenerateRegistrationQR } from '../common/utils/checkin-mode.utils';
```

**Frontend:** Use utilities from `@/utils`:
```javascript
import { ROLES, formatDate, getCategoryColor, extractErrorMessage } from '@/utils';
```

⚡ Check if utility exists before writing duplicate code.

---

## 🔒 Architecture & Best Practices

### Backend Best Practices
- ✅ Prisma ORM (no SQL injection)
- ✅ TypeScript strict mode
- ✅ DTOs with validation
- ✅ Cryptographic security (crypto.randomBytes)
- ✅ Proper error handling
- ✅ Swagger API documentation

**See DEVELOPMENT.md** for pre-commit checklist, feature implementation guide, and testing documentation.

### Frontend Best Practices
- ✅ React 19 + hooks
- ✅ Tailwind CSS (no inline styles)
- ✅ Shared constants (no hardcoded strings)
- ✅ Error handling with utilities
- ✅ Responsive design
- ✅ Dark theme support

---

## 📝 Adding New Features - Documentation Rule

**When implementing a new major feature:**

1. ✅ **Create documentation FIRST** in `docs/FEATURE_NAME.md`
   - Include: Overview, business logic, architecture, API endpoints, testing
   - Use `docs/QR_CHECKIN_SYSTEM.md` as template (1038 lines example)

2. ✅ **Implement the feature** following the documentation

3. ✅ **Update main docs**:
   - `CLAUDE.md` - Add to Recent Updates and Documentation Index
   - `PROJECT_STATUS.md` - Update completion status
   - `README.md` - Add to features list if user-facing

**Benefits:**
- AI agents (like Claude) can understand features without analyzing all code
- Faster onboarding for new developers
- Clear specifications before implementation
- Single source of truth for business logic

---

## 🚀 Common Development Tasks

### Adding Backend Endpoint
1. Generate module/service/controller
2. Create DTOs with validation
3. Implement service method
4. Add Swagger decorators
5. Use shared utilities from `common/utils`
6. Add authorization checks
7. Test with `npm test`

**See DEVELOPMENT.md** for step-by-step guide.

### Adding Frontend Page
1. Create component in `pages/`
2. Create service in `services/` if needed
3. Add route in `App.jsx`
4. Use shared utilities from `@/utils`
5. Add navigation link
6. Test responsive design

**See DEVELOPMENT.md** for step-by-step guide.

### Database Changes
1. Edit `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Generate client: `npx prisma generate`
4. Update seed if needed
5. Test migrations

**See SETUP.md** for database operations.

### Running Tests
```bash
# Backend unit tests
cd backend && npm test

# Specific test file
cd backend && npm test -- checkin-mode.utils.spec.ts

# Backend E2E tests
cd backend && npm run test:e2e

# Frontend tests
cd frontend && npm test

# With coverage
npm run test:cov  # backend
npm run test:coverage  # frontend
```

**See DEVELOPMENT.md** for comprehensive testing guide (Testing section).

### Data Migrations (One-Time Operations)

**IMPORTANT:** Data migrations should NOT be in startup scripts!

**Correct approach (Prisma best practice):**
```bash
# Option 1: SQL Migration (RECOMMENDED)
# Already created: backend/prisma/migrations/20251202141922_fix_checkin_modes_data/
# Runs automatically with: npx prisma migrate dev

# Option 2: Manual TypeScript Script (if needed for complex logic)
cd backend && npx ts-node scripts/fix-checkin-modes.ts
# Run ONCE manually, not in start.sh
```

**See:** `docs/DATA_MIGRATION_GUIDE.md` for complete best practices

---

## ⚠️ Status & Roadmap

### MVP Launch: 6 Weeks (240-304 hours)

**Current Status:**
- 🟢 3/8 critical security fixes done (Helmet, secrets, validation)
- 🟡 3 more security fixes for MVP (webhook, IDOR, race conditions)
- 🔴 5 security fixes deferred (JWT cookies, CSRF, XSS, etc.)

**MVP Priorities (see [`PROJECT_STATUS.md`](PROJECT_STATUS.md)):**
1. **Week 1:** Critical security (webhook verification, IDOR, race conditions)
2. **Week 2:** Moderation system (MODERATOR role, queue, filters)
3. **Week 3-4:** Monetization (pricing, ads, paid events, premium)
4. **Week 5:** Gamification (points, levels, achievements)
5. **Week 6:** Testing & production (E2E, load, security)

**Expected Results:**
- ✅ Full monetization system operational
- ✅ MODERATOR role with moderation workflow
- ✅ Basic gamification live
- ✅ 200+ students, 30-50k тг/month revenue target

**Deferred Features:**
- Full security hardening (5 critical issues)
- Personalized recommendations
- Kaspi API integration (manual verification instead)

**Full roadmap:** See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) (includes complete implementation details)

---

## 📊 Useful Commands

### Backend
```bash
cd backend
npm run start:dev       # Dev server with hot reload
npm run build          # Production build
npm test               # Unit tests
npm run lint           # ESLint check
npx prisma migrate dev # Create & apply migration
npx prisma studio     # Database GUI
```

### Frontend
```bash
npm run dev            # Dev server (port 5173)
npm run build          # Production build
npm run preview        # Preview built version
```

### Docker
```bash
docker-compose up -d postgres              # Database only
docker-compose up -d                       # All services
docker-compose logs -f                     # Live logs
docker-compose down -v                     # Stop & remove data
```

---

## 🚀 Implementing New Features

### Adding MODERATOR Role
```typescript
// 1. Update schema (backend/prisma/schema.prisma)
enum Role {
  STUDENT
  ORGANIZER
  ADMIN
  MODERATOR  // Add this
}

// 2. Create migration
npx prisma migrate dev --name add-moderator-role

// 3. Update constants (backend/src/common/constants/roles.ts)
export const ROLES = {
  STUDENT: 'STUDENT',
  ORGANIZER: 'ORGANIZER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',  // Add this
};

// 4. Use in guards
@Roles(ROLES.MODERATOR, ROLES.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
```

### Adding Gamification
```typescript
// 1. Create models (backend/prisma/schema.prisma)
model UserPoints {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  points    Int      @default(0)
  level     String   @default("NOVICE") // NOVICE, ACTIVIST, LEADER, LEGEND
  updatedAt DateTime @updatedAt
}

model Achievement {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        String   // FIRST_EVENT, CULTURAL_10, SPORTS_10, etc.
  earnedAt    DateTime @default(now())
}

// 2. Create service (backend/src/gamification/gamification.service.ts)
async awardPoints(userId: string, points: number, reason: string) {
  const userPoints = await this.prisma.userPoints.upsert({
    where: { userId },
    create: { userId, points },
    update: { points: { increment: points } },
  });
  
  // Check level up
  const newLevel = this.calculateLevel(userPoints.points);
  if (newLevel !== userPoints.level) {
    await this.levelUp(userId, newLevel);
  }
}
```

### Adding Monetization
```typescript
// 1. Pricing tiers (backend/src/pricing/pricing.service.ts)
const PRICING_TIERS = {
  BASIC: { price: 5000, name: 'Базовое размещение' },
  PREMIUM: { price: 10000, name: 'Премиум размещение' },
  PACKAGE_5: { price: 20000, name: 'Пакет (5 мероприятий)' },
};

// 2. Advertisement positions
const AD_POSITIONS = {
  TOP_BANNER: { price: 10000, size: '300x100', placement: 'hero' },
  NATIVE_FEED: { price: 8000, size: 'card', placement: 'feed' },
  STORY_BANNER: { price: 15000, size: 'vertical', placement: 'stories' },
};
```

**See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for complete implementation guide.**

---

## 🔍 Key Files Reference

**Configuration:**
- `backend/.env` - Backend environment variables
- `backend/tsconfig.json` - TypeScript config (strict mode enabled)
- `frontend/.env` - Frontend config (optional)
- `docker-compose.yml` - Docker services

**Database:**
- `backend/prisma/schema.prisma` - Database schema
- `backend/prisma/seed.ts` - Seed data
- `backend/prisma/migrations/` - Migration history

**Utilities:**
- `backend/src/common/utils/` - Backend utilities
- `backend/src/common/constants/` - Backend constants
- `frontend/js/utils/` - Frontend utilities

**Entry Points:**
- `backend/src/main.ts` - Backend entry
- `frontend/js/App.jsx` - Frontend routes
- `backend/src/app.module.ts` - Global setup

---

## 🎓 Learning Resources

**See documentation:**
- **SETUP.md** - Installation & configuration
- **DEVELOPMENT.md** - Dev tools & checklists
- **PROJECT_STATUS.md** - Status & roadmap

**External:**
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## ❓ FAQ

**Q: How do I add a new API endpoint?**
A: See DEVELOPMENT.md → "Adding a New Backend Feature"

**Q: Where are the shared utilities?**
A: Backend: `backend/src/common/utils/` | Frontend: `frontend/js/utils/`

**Q: How do I run tests?**
A: See DEVELOPMENT.md → Testing section for complete testing guide

**Q: What's not production-ready?**
A: See PROJECT_STATUS.md → "Critical Issues"

**Q: How do I set up my environment (Windows/WSL)?**
A: See WSL_VS_WINDOWS_ANALYSIS.md or SETUP.md

**Q: When can this go to production?**
A: After 8-10 weeks of fixes. See PROJECT_STATUS.md for roadmap.

---

## 🔗 Documentation Index

1. **README.md** - Project overview & quick start
2. **PROJECT_STATUS.md** - Complete status, implementation plan, roadmap, metrics
3. **SETUP.md** - Installation, Docker, environment config
4. **DEVELOPMENT.md** - Dev checklists, tools, UI guidelines, testing guide
5. **CLAUDE.md** - This file (quick reference for Claude Code)
6. **WSL_VS_WINDOWS_ANALYSIS.md** - Platform comparison
7. **docs/QR_CHECKIN_SYSTEM.md** - Complete QR Check-In System documentation (1038 lines)
8. **docs/DATA_MIGRATION_GUIDE.md** - 🆕 Data Migration Best Practices (Prisma verified)

---

**Last Updated:** 2025-12-01
**Version:** 4.2 (QR Check-In System Complete - 4 Event Types)

For detailed status and implementation plan, refer to [`PROJECT_STATUS.md`](PROJECT_STATUS.md) 👆
