# Development Guide, Testing & Checklists

Comprehensive development tools, testing guide, checklists, and guidelines for MNU Events Platform developers.

> **Note:** This file combines development guidelines and testing documentation. For project status, see [PROJECT_STATUS.md](PROJECT_STATUS.md).

## 📋 Table of Contents

**Development Guidelines:**
- [Pre-commit Checklist](#pre-commit-checklist)
- [Feature Implementation Guide](#feature-implementation-guide)
- [UI/UX Guidelines](#uiux-guidelines)
- [Dark Theme Implementation](#dark-theme-implementation)
- [Code Analysis Quick Reference](#code-analysis-quick-reference)
- [Development Environment](#development-environment)

**Testing Documentation:**
- [Testing Overview](#testing-overview)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [E2E Testing](#e2e-testing)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)

---

## ✅ Pre-commit Checklist

Before committing code, ensure:

### Backend Changes

- [ ] **Code Quality**
  - [ ] Run `npm run lint` - ESLint check passes
  - [ ] Run `npm run build` - TypeScript compilation succeeds
  - [ ] All types are explicit (no `any` types unless justified)

- [ ] **Testing**
  - [ ] New features have unit tests
  - [ ] All tests pass: `npm test`
  - [ ] Coverage didn't decrease

- [ ] **Database**
  - [ ] Schema changes have corresponding migrations
  - [ ] Migration can run forward and backward
  - [ ] Run `npx prisma generate` after schema changes

- [ ] **Security**
  - [ ] No hardcoded secrets in code
  - [ ] Input validation added to DTOs
  - [ ] Authorization checks on protected routes
  - [ ] No SQL injection vectors (using Prisma ORM)

- [ ] **Performance**
  - [ ] No N+1 queries (use `include` or `relationLoadStrategy`)
  - [ ] Database indexes exist for frequently queried fields
  - [ ] Pagination implemented for large result sets

- [ ] **Documentation**
  - [ ] JSDoc comments added to public methods
  - [ ] Swagger decorators added to API endpoints
  - [ ] README updated if new dependencies added

### Frontend Changes

- [ ] **Code Quality**
  - [ ] Run `npm run build` - Production build succeeds
  - [ ] No console errors or warnings
  - [ ] ESLint passes (if configured)

- [ ] **React Best Practices**
  - [ ] Props are properly validated
  - [ ] No unnecessary re-renders (use `React.memo` for expensive components)
  - [ ] useEffect has proper dependencies array
  - [ ] No memory leaks (cleanup functions on unmount)

- [ ] **Styling**
  - [ ] Using Tailwind CSS (no inline styles)
  - [ ] Responsive design tested on mobile/tablet/desktop
  - [ ] Dark theme support (if applicable)
  - [ ] Consistent spacing and typography

- [ ] **Testing**
  - [ ] Manual testing completed
  - [ ] Component tests pass (if applicable)
  - [ ] E2E tests pass (if applicable)

- [ ] **Performance**
  - [ ] No large bundle size increases
  - [ ] Images optimized (use CDN or compression)
  - [ ] API calls debounced where appropriate

- [ ] **Accessibility**
  - [ ] Alt text on images
  - [ ] Proper heading hierarchy
  - [ ] Keyboard navigation works
  - [ ] Color contrast meets WCAG standards

- [ ] **Documentation**
  - [ ] Comments added for complex logic
  - [ ] Component props documented
  - [ ] README/SETUP updated if new features

### Git Commit

- [ ] Commit message is clear and descriptive
  - Use format: `type(scope): description`
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `perf`, `security`
  - Example: `feat(payments): add QR code generation for tickets`

- [ ] Changes are logically grouped (atomic commits)
- [ ] No debug code left (console.log, debugger)
- [ ] No commented-out code blocks

---

## 🚀 Feature Implementation Guide

### Adding a New Backend Feature

**Example: Adding a new API endpoint**

```bash
# 1. Create the feature module
nest generate module features/my-feature
nest generate service features/my-feature
nest generate controller features/my-feature

# 2. Define DTOs
mkdir backend/src/my-feature/dto
touch backend/src/my-feature/dto/create-my-feature.dto.ts
touch backend/src/my-feature/dto/update-my-feature.dto.ts

# 3. Implement service methods
# Edit: backend/src/my-feature/my-feature.service.ts

# 4. Implement controller endpoints
# Edit: backend/src/my-feature/my-feature.controller.ts
# Add Swagger decorators: @ApiOperation, @ApiResponse

# 5. Database changes (if needed)
npx prisma migrate dev --name add-my-feature
npx prisma generate

# 6. Add tests
touch backend/src/my-feature/my-feature.service.spec.ts
touch backend/src/my-feature/my-feature.controller.spec.ts

# 7. Run verification
npm run build
npm run lint
npm test
npm run start:dev
```

**Best Practices:**
- Use shared utilities from `common/utils`
- Add proper DTOs with validation
- Document endpoints with Swagger
- Implement authorization checks
- Add database indexes for query performance
- Write unit tests

### Adding a New Frontend Page

**Example: Creating a new page**

```bash
# 1. Create page component
touch frontend/js/pages/MyNewPage.jsx

# 2. Create page structure
# ├── Page component
# ├── Import services
# ├── Use auth context
# └── Apply layout wrapper

# 3. Create corresponding service (if needed)
touch frontend/js/services/myNewService.js

# 4. Add route in App.jsx
# Import page and add route:
# <Route path="/my-new-page" element={<ProtectedRoute roles={['ADMIN']}><MyNewPage /></ProtectedRoute>} />

# 5. Test the page
npm run dev
# Visit http://localhost:5173/my-new-page

# 6. Add to navigation (if user-facing)
# Edit: frontend/js/components/Layout.jsx or relevant layout

# 7. Run production build test
npm run build
npm run preview
```

**Best Practices:**
- Use shared utilities from `@/utils`
- Implement proper error handling
- Add loading states for API calls
- Use React hooks properly
- Test on multiple screen sizes
- Add documentation in component

### Implementing External Partner Features

**Example: Adding a partner-specific feature**

```bash
# 1. Check if partner is authenticated
import { ROLES } from '@/utils';

const isPartner = user?.role === ROLES.EXTERNAL_PARTNER;

# 2. Add partner-specific logic in backend
@Roles(ROLES.EXTERNAL_PARTNER, ROLES.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async getPartnerDashboard(@CurrentUser() user: User) {
  // Partner-specific logic
}

# 3. Use PartnerLayout for partner pages
import PartnerLayout from '@/components/PartnerLayout';

function PartnerDashboard() {
  return (
    <PartnerLayout>
      {/* Partner dashboard content */}
    </PartnerLayout>
  );
}

# 4. Add commission calculation
const commission = event.price * (partner.commissionRate || 0.10);
```

**Key Partner Features**:
- Commission tracking (default 10%)
- Event limits (2 free/month, buy additional slots at 3,000₸)
- Payment verification (partners can verify student payments)
- Dedicated orange-themed layout
- Moderation for partner events (PENDING_MODERATION status)

### Implementing Gamification Features

**Example: Adding points for user actions**

```typescript
// Backend: Award points
import { GamificationService } from '../gamification/gamification.service';

async someUserAction(userId: string) {
  // ... perform action

  // Award points
  await this.gamificationService.awardPoints(
    userId,
    10, // points amount
    'Attended event' // reason
  );
}

// Frontend: Display user level and points
import { gamificationService } from '@/services/gamificationService';

const userStats = await gamificationService.getUserStats(userId);
// { points: 150, level: 'ACTIVE', achievements: [...] }
```

**Gamification System**:
- Points: Awarded for attendance, participation
- Levels: NEWCOMER → ACTIVE → LEADER → LEGEND
- Achievements: 4 types (ATTENDANCE, CATEGORY, REGULARITY, SOCIAL)
- CSI Dashboard: Student statistics by category

### Implementing Moderation Features

**Example: Submitting content for moderation**

```typescript
// Backend: Create moderation queue entry
async createService(createDto: CreateServiceDto, userId: string) {
  const service = await this.prisma.service.create({
    data: { ...createDto, userId, status: 'PENDING_MODERATION' }
  });

  // Create moderation queue entry
  await this.moderationService.createQueueEntry({
    type: 'SERVICE',
    itemId: service.id,
    status: 'PENDING',
  });
}

// Frontend: Display moderation status
const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';
```

**Moderation Features**:
- Queue for SERVICES, EVENTS, ADVERTISEMENTS
- Approve/Reject workflow with reasons
- Auto-approval for ADMIN/MODERATOR
- Technical filters (100 char minimum, repetition detection)

### Adding a New Component

```bash
# 1. Create component
touch frontend/js/components/MyComponent.jsx

# 2. Component structure
function MyComponent({ prop1, prop2 }) {
  return (
    <div className="component-container">
      {/* Component content */}
    </div>
  );
}

export default MyComponent;

# 3. Add to appropriate page or layout
import MyComponent from '@/components/MyComponent';

# 4. Optimize if heavy
import { memo } from 'react';
export default memo(MyComponent);

# 5. Test in story or directly in page
npm run dev
```

**Best Practices:**
- Keep components focused and reusable
- Use Tailwind for styling
- Pass props clearly
- Memoize expensive components
- Add JSDoc comments
- Test with various prop combinations

### Database Migration

```bash
cd backend

# 1. Edit schema
# Edit: backend/prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name describe-change

# 3. Generate Prisma client
npx prisma generate

# 4. Update seed if needed
# Edit: backend/prisma/seed.ts

# 5. Test the migration
npx prisma db push
npx prisma db seed

# 6. Verify schema
npx prisma studio
```

**Best Practices:**
- Write descriptive migration names
- Test migrations work forward and backward
- Create indexes for frequently queried fields
- Add cascading deletes if appropriate
- Document complex relations in comments

---

## 🧪 Testing Checklist

### Manual Testing Workflow

**Before Running E2E Tests:**

1. **Clear State**
   ```bash
   docker-compose down -v
   docker-compose up -d postgres
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

2. **Start Services**
   - Terminal 1: `cd backend && npm run start:dev`
   - Terminal 2: `npm run dev` (frontend)

3. **Test User Flows**
   - [ ] Login/Logout works
   - [ ] Navigation works on all pages
   - [ ] Forms validate properly
   - [ ] API errors are handled gracefully
   - [ ] No console errors

4. **Feature Testing**
   - [ ] Create event
   - [ ] Register for event
   - [ ] View profile
   - [ ] Admin features
   - [ ] Payment flow (mock)

### E2E Testing

**Run Playwright Tests**
```bash
# Start servers first
npm run dev  # frontend
npm run start:dev  # backend (from backend dir)

# Run E2E tests
npx playwright test

# Run specific test
npx playwright test e2e/paid-events.spec.js

# Run with UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

**Critical Test Scenarios:**
- [ ] User registration and login
- [ ] Event creation and filtering
- [ ] Event registration and waitlist
- [ ] Payment processing (mock)
- [ ] QR code generation and validation
- [ ] Admin dashboard access
- [ ] Role-based access control

### Unit Testing

**Backend Tests**
```bash
cd backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:cov

# Specific test file
npm test auth.service.spec.ts
```

**Frontend Tests** (if configured with Vitest)
```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

---

## 🎨 UI/UX Guidelines

### Liquid Glass Design System

The MNU Events Platform uses a **liquid glass (glassmorphism)** design with:
- Dark theme as default
- Semi-transparent backgrounds with backdrop blur
- Neon accent color (#d62e1f - Red)
- Smooth gradients
- Hover animations

### Color Palette

**Primary Colors:**
```css
Background Dark:     #0a0a0a (main background)
Background Medium:   #1a1a1a (cards, containers)
Background Light:    #2a2a2a (borders, accents)
Text Primary:        #ffffff (main text)
Text Secondary:      #a0a0a0 (secondary text)
Accent Red:          #d62e1f (buttons, highlights)
Accent Red Hover:    #b91c1c (button hover state)
```

### Typography

**Font Stack:** `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;`

**Sizes:**
- Heading H1: 48px-72px (bold)
- Heading H2: 36px (bold)
- Heading H3: 24px (bold)
- Body: 14-16px
- Caption: 12px

**Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Component Patterns

**Buttons:**
```jsx
// Primary Button
<button className="bg-[#d62e1f] hover:bg-[#b91c1c] text-white font-bold py-2 px-4 rounded-lg transition-colors">
  Action
</button>

// Secondary Button
<button className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a] font-bold py-2 px-4 rounded-lg transition-colors">
  Secondary
</button>

// Ghost Button
<button className="text-white hover:text-[#d62e1f] transition-colors">
  Ghost
</button>
```

**Cards:**
```jsx
// Glass Card
<div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-[#2a2a2a] rounded-lg p-6">
  <h3 className="text-white font-bold">Card Title</h3>
  <p className="text-[#a0a0a0] mt-2">Card content</p>
</div>
```

**Inputs:**
```jsx
<input
  type="text"
  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 placeholder-[#666] focus:outline-none focus:border-[#d62e1f] transition-colors"
  placeholder="Enter text..."
/>
```

### Responsive Design Breakpoints

```css
Mobile:    < 640px   (sm)
Tablet:    640px+    (md)
Desktop:   1024px+   (lg)
Wide:      1280px+   (xl)
```

**Mobile-First Approach:**
- Design for mobile first
- Add features for larger screens
- Test on actual devices
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`

---

## 🎨 Dark Theme Implementation

### Current Status

**Completed:**
- ✅ Color palette defined in `constants.js`
- ✅ Global styles in `globals.css`
- ✅ BottomNavigation component
- ✅ FilterSheet component
- ✅ Most pages updated to dark theme

**TODO:**
- [ ] Hero Section: Apply gradient background
- [ ] HomePage → Dashboard: Refactor as landing page
- [ ] Layout: Update header colors
- [ ] All Components: Verify dark theme colors

### Implementing Dark Theme for New Components

**Step 1: Use Color Constants**
```jsx
import { COLORS } from '@/utils';

<div style={{ backgroundColor: COLORS.darkBg }}>
  <h1 style={{ color: COLORS.textPrimary }}>Title</h1>
  <p style={{ color: COLORS.textSecondary }}>Secondary text</p>
</div>
```

**Step 2: Apply Tailwind Classes**
```jsx
<div className="bg-[#0a0a0a] text-white">
  <h1 className="text-white font-bold">Title</h1>
  <p className="text-[#a0a0a0]">Secondary text</p>
  <button className="bg-[#d62e1f] hover:bg-[#b91c1c] text-white">
    Action
  </button>
</div>
```

**Step 3: Add Liquid Glass Effect**
```jsx
<div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-[#2a2a2a] rounded-xl">
  {/* Glass card content */}
</div>
```

### Layout Update Example

**Before (Light Theme):**
```jsx
<header className="bg-white text-gray-900 border-b">
  {/* Light header */}
</header>
```

**After (Dark Theme):**
```jsx
<header className="bg-[#1a1a1a] text-white border-b border-[#2a2a2a]">
  {/* Dark header */}
</header>
```

### Testing Dark Theme

- [ ] Verify colors on different backgrounds
- [ ] Check text contrast (WCAG AA minimum)
- [ ] Test on mobile (Bottom Navigation visible)
- [ ] Test on desktop (Full header visible)
- [ ] Verify accent colors pop against dark bg
- [ ] Test hover/active states

---

## 📊 Code Analysis Quick Reference

### File Structure Overview

```
backend/src/
├── auth/                    # Authentication, JWT, email verification
├── users/                   # User management (5 roles: STUDENT, ORGANIZER, MODERATOR, ADMIN, EXTERNAL_PARTNER)
├── events/                  # Event management, filtering
├── registrations/           # Event registrations, check-ins
├── clubs/                   # Clubs and memberships
├── payments/                # Payment processing (mock + verification)
├── payment-verification/    # Payment verification for organizers & partners
├── checkin/                 # QR validation (Type 1 + Type 2)
├── services/                # Marketplace services
├── analytics/               # Statistics and dashboards
├── gamification/            # Points, levels, achievements
├── moderation/              # Content moderation (MODERATOR role)
├── advertisements/          # Advertisement system
├── partners/                # External partners management
├── platform-settings/       # Platform-wide settings
├── settings/                # Event pricing configuration
├── subscriptions/           # Premium subscriptions
├── health/                  # Health check endpoints
├── common/                  # ⭐ Shared utilities & constants
├── prisma/                  # Database service (singleton)
├── config/                  # Configuration loader
└── app.module.ts            # Main app module

frontend/js/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn-style components
│   ├── Layout.jsx           # Main layout wrapper
│   ├── PartnerLayout.jsx    # Partner layout (orange theme)
│   ├── ProtectedRoute.jsx   # Route protection
│   ├── BottomNavigation.jsx # Mobile navigation
│   ├── EventLimitModal.jsx  # Partner event limits
│   └── ...
├── pages/            # Route components (42 pages)
│   ├── Home/Events/Clubs pages
│   ├── Partner pages (Dashboard, Events, Admin)
│   ├── Moderation pages
│   ├── CSI Dashboard
│   ├── Marketplace & More pages
│   └── ...
├── services/         # API client & domain services (13 services)
├── context/          # React Context (auth)
├── utils/            # ⭐ Shared utilities & constants
└── App.jsx           # Route definitions
```

### Key Files by Role

**Backend Developer:**
- `app.module.ts` - Global setup
- `common/utils/` - Reusable utilities
- `<feature>/<feature>.service.ts` - Business logic
- `<feature>/<feature>.controller.ts` - API endpoints
- `prisma/schema.prisma` - Database schema

**Frontend Developer:**
- `App.jsx` - Route definitions
- `components/Layout.jsx` - Page wrapper
- `services/apiClient.js` - API configuration
- `context/AuthContext.jsx` - Global auth state
- `utils/constants.js` - Shared constants

**Full Stack Developer:**
- All of the above + DevOps considerations

### Navigation by Task

**I need to add a new API endpoint:**
1. Generate module/service/controller
2. Create DTOs in `<feature>/dto/`
3. Implement service method
4. Add controller endpoint with Swagger
5. Add authorization check
6. Test with Swagger UI

**I need to create a new page:**
1. Create component in `pages/`
2. Create service in `services/` if needed
3. Add route in `App.jsx`
4. Add navigation link
5. Test the page

**I need to fix a bug:**
1. Reproduce in development
2. Identify affected file(s)
3. Create test case
4. Fix code
5. Verify all tests pass

**I need to optimize performance:**
1. Check for N+1 queries (backend)
2. Add missing indexes (database)
3. Use pagination utilities
4. Add Redis caching
5. Implement code splitting (frontend)

---

## 💻 Development Environment

### Required Tools

```bash
# Check versions
node --version          # 20+
npm --version          # 10+
docker --version       # 24+
docker-compose --version # v2.20+
git --version          # 2.40+
```

### Useful Commands Reference

**Backend**
```bash
cd backend

# Development
npm run start:dev       # Start with hot reload
npm run start:debug    # Start with debugger
npm run build          # Production build

# Testing
npm test               # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # With coverage

# Code Quality
npm run lint           # ESLint check
npm run format         # Prettier formatting

# Database
npx prisma migrate dev        # Create & apply migration
npx prisma migrate deploy     # Apply migrations
npx prisma db seed           # Seed database
npx prisma studio           # GUI for database
```

**Frontend**
```bash
# Development
npm run dev             # Start dev server (port 5173)
npm run build          # Production build
npm run preview        # Preview built version

# Code Quality
npm run lint           # ESLint (if configured)

# Testing
npm run test           # Unit tests (if configured)
npm run test:e2e       # E2E tests
npm run test:ui        # Playwright UI
```

**Docker**
```bash
# Services
docker-compose up -d postgres          # Start database only
docker-compose up -d               # Start all services
docker-compose down                # Stop all services
docker-compose down -v             # Stop and remove data

# Logs
docker-compose logs -f             # Follow logs
docker-compose logs backend        # Backend logs only

# Database Operations
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma db seed
docker-compose exec backend npx prisma studio
```

### Debugging Tips

**Backend:**
```bash
# Add debugger statement
debugger;

# Start with debugger
npm run start:debug

# VS Code debug: Use launch.json
# Attach debugger at port 9229
```

**Frontend:**
```bash
# Browser DevTools (F12)
# - Console for errors
# - Network tab for API calls
# - Performance for optimization

# React DevTools
# Chrome extension for React component inspection

# Add debug logging
console.log('Debug:', value);
```

**Database:**
```bash
# Open GUI
npx prisma studio

# Check schema
npx prisma db execute --stdin < query.sql

# Inspect data
docker-compose exec postgres psql -U postgres -d mnu_events
```

---

## 📚 Related Documentation

- **SETUP.md** - Installation and configuration
- **PROJECT_STATUS.md** - Project status and roadmap
- **CLAUDE.md** - Detailed development guidelines
- **README.md** - Quick overview

---

**Last Updated:** 2025-11-28
**Version:** 2.1 (Updated with Partners System & Latest Features)
# Testing Guide

Comprehensive testing guide for MNU Events Platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [E2E Testing](#e2e-testing)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)

---

## Overview

The MNU Events Platform uses a comprehensive testing strategy:

- **Backend**: Jest + Supertest for unit and E2E tests
- **Frontend**: Vitest + React Testing Library (configuration ready)
- **Target Coverage**: 80% for backend, 70% for frontend

### Current Test Coverage

| Module | Unit Tests | E2E Tests | Coverage |
|--------|------------|-----------|----------|
| Auth | ✅ 8 tests | ✅ 12 tests | ~60% |
| Events | ✅ 15 tests | ✅ 18 tests | ~70% |
| Payments | ✅ 12 tests | ❌ Pending | ~55% |
| Gamification | ❌ Pending | ❌ Pending | <10% |
| Moderation | ❌ Pending | ❌ Pending | <10% |
| Partners | ❌ Pending | ❌ Pending | <10% |
| CheckIn | ❌ Pending | ❌ Pending | <10% |
| Services | ❌ Pending | ❌ Pending | <10% |
| Clubs | ❌ Pending | ❌ Pending | <10% |
| Frontend Utils | ✅ 30 tests | N/A | ~90% |

**Overall Coverage**: ~45% backend, ~20% frontend

---

## Backend Testing

### Setup

All testing dependencies are already installed:

```bash
cd backend
npm install  # Installs jest, supertest, etc.
```

### Unit Tests

Unit tests test individual service methods in isolation.

**Location**: `backend/src/**/*.spec.ts`

**Run unit tests**:
```bash
cd backend
npm test                # Run all unit tests
npm run test:watch      # Watch mode
npm run test:cov        # With coverage
```

**Example**: `auth.service.spec.ts`
```typescript
describe('AuthService', () => {
  it('should successfully login with valid credentials', async () => {
    // Test implementation
  });
});
```

### E2E Tests

E2E tests test complete API flows with real HTTP requests.

**Location**: `backend/test/**/*.e2e-spec.ts`

**Run E2E tests**:
```bash
cd backend
npm run test:e2e
```

**Requirements**:
- PostgreSQL must be running
- Database must be accessible
- Tests use a separate test database (recommended)

**Example**: `auth.e2e-spec.ts`
```typescript
describe('Auth (e2e)', () => {
  it('should register a new user successfully', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);
  });
});
```

### Test Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   └── auth.service.spec.ts      # Unit tests
│   ├── events/
│   │   ├── events.service.ts
│   │   └── events.service.spec.ts    # Unit tests
│   └── payments/
│       ├── payments.service.ts
│       └── payments.service.spec.ts  # Unit tests
└── test/
    ├── jest-e2e.json                 # E2E config
    ├── auth.e2e-spec.ts              # Auth E2E
    └── events.e2e-spec.ts            # Events E2E
```

---

## Frontend Testing

### Setup

Install testing dependencies:

```bash
cd frontend
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @vitest/ui \
  jsdom \
  @vitest/coverage-v8
```

### Component Tests

Test React components in isolation.

**Location**: `frontend/test/**/*.test.jsx`

**Run tests**:
```bash
cd frontend
npm test              # Run all tests
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage
```

**Example**: Testing a utility function
```javascript
import { describe, it, expect } from 'vitest';
import { formatDate } from '../js/utils';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-11-20T14:30:00Z');
    const result = formatDate(date);
    expect(result).toBeTruthy();
  });
});
```

### Test Structure

```
frontend/
├── js/
│   ├── components/
│   │   └── EventCard.jsx
│   ├── pages/
│   │   └── HomePage.jsx
│   └── utils/
│       └── index.js
└── test/
    ├── setup.js                # Test setup
    ├── utils.test.js           # Utils tests
    └── components/
        └── EventCard.test.jsx  # Component tests (to be added)
```

---

## E2E Testing

### Backend E2E Tests

**Implemented Tests**:

#### Authentication Flow (`auth.e2e-spec.ts`)
- ✅ User registration
- ✅ Email validation
- ✅ Password validation
- ✅ Login with verification
- ✅ Duplicate email handling
- ✅ Full auth flow (register → verify → login → logout)

#### Events CRUD (`events.e2e-spec.ts`)
- ✅ Create event (authorized/unauthorized)
- ✅ List events with pagination
- ✅ Filter events by category
- ✅ Get event details
- ✅ Update event (creator/non-creator)
- ✅ Delete event (authorization checks)
- ✅ Date validation (past dates, invalid ranges)

### Running E2E Tests

```bash
cd backend

# Make sure PostgreSQL is running
docker-compose up -d postgres

# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.e2e-spec.ts
```

**Important Notes**:
- E2E tests create real database records
- Tests clean up after themselves
- Use unique timestamps in test data to avoid conflicts
- Tests require database to be running

---

## Running Tests

### Quick Start

```bash
# Backend unit tests
cd backend && npm test

# Backend E2E tests
cd backend && npm run test:e2e

# Frontend tests
cd frontend && npm test

# All tests with coverage
cd backend && npm run test:cov
cd frontend && npm run test:coverage
```

### Continuous Integration

Tests are designed to run in CI/CD pipelines:

```bash
# In CI environment
cd backend
npm ci
npm run test:cov
npm run test:e2e

cd ../frontend
npm ci
npm run test:coverage
```

---

## Writing Tests

### Backend Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { PrismaService } from '../prisma/prisma.service';

describe('YourService', () => {
  let service: YourService;
  let prisma: PrismaService;

  const mockPrismaService = {
    model: {
      findUnique: jest.fn(),
      create: jest.fn(),
      // ... other methods
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const mockData = { id: '1', name: 'Test' };
    mockPrismaService.model.findUnique.mockResolvedValue(mockData);

    // Act
    const result = await service.doSomething('1');

    // Assert
    expect(result).toEqual(mockData);
    expect(mockPrismaService.model.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });
});
```

### Backend E2E Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('YourModule (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/your-endpoint (POST)', () => {
    return request(app.getHttpServer())
      .post('/your-endpoint')
      .send({ data: 'test' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
      });
  });
});
```

### Frontend Test Template

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import YourComponent from '../components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(
      <BrowserRouter>
        <YourComponent />
      </BrowserRouter>
    );

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const mockHandler = vi.fn();
    render(
      <BrowserRouter>
        <YourComponent onAction={mockHandler} />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});
```

---

## Coverage Reports

### Backend Coverage

```bash
cd backend
npm run test:cov
```

**Output**:
- Console summary
- HTML report: `backend/coverage/index.html`
- JSON report: `backend/coverage/coverage-final.json`

### Frontend Coverage

```bash
cd frontend
npm run test:coverage
```

**Output**:
- Console summary
- HTML report: `frontend/coverage/index.html`

### Viewing Coverage

```bash
# Backend
open backend/coverage/index.html

# Frontend
open frontend/coverage/index.html
```

---

## Best Practices

### General

1. **Test Naming**: Use descriptive test names
   ```typescript
   it('should throw BadRequestException when end date is before start date', () => {})
   ```

2. **AAA Pattern**: Arrange, Act, Assert
   ```typescript
   it('should create event', async () => {
     // Arrange
     const createDto = { /* ... */ };

     // Act
     const result = await service.create(createDto);

     // Assert
     expect(result).toHaveProperty('id');
   });
   ```

3. **Isolation**: Each test should be independent
4. **Cleanup**: Clean up test data in `afterEach` or `afterAll`
5. **Mocking**: Mock external dependencies (database, APIs, etc.)

### Backend

1. **Mock Prisma**: Always mock PrismaService in unit tests
2. **Test Edge Cases**: Null values, invalid inputs, authorization
3. **Use Factories**: Create test data factories for complex objects
4. **Database Cleanup**: Clean up E2E test data

### Frontend

1. **User-Centric**: Test from user's perspective
2. **Avoid Implementation Details**: Don't test internal state
3. **Async Handling**: Use `waitFor` for async operations
4. **Accessibility**: Use accessible queries (`getByRole`, `getByLabelText`)

---

## Troubleshooting

### Backend Tests Failing

**Prisma Client not generated or out of date**:
```bash
# Regenerate Prisma Client (IMPORTANT!)
cd backend
npx prisma generate

# If network issues in Docker, try:
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

**Known Issues (2025-11-20)**:
- ⚠️ Tests may fail if Prisma Client is not regenerated after schema changes
- ⚠️ Network restrictions in Docker may prevent Prisma binary downloads
- ✅ Solution: Run `npx prisma generate` in local environment before running tests

**Database connection errors**:
```bash
# Ensure PostgreSQL is running
docker-compose up -d postgres

# Check connection
docker-compose ps
```

**Module resolution errors**:
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend Tests Failing

**JSDOM errors**:
```bash
# Ensure jsdom is installed
npm install --save-dev jsdom
```

**Module not found**:
```bash
# Check alias configuration in vitest.config.js
# Ensure paths match actual file structure
```

---

## Next Steps

### Pending Tests

1. **Backend**:
   - [ ] Gamification module unit tests
   - [ ] Moderation module unit tests
   - [ ] Partners module unit tests
   - [ ] Payment Verification module unit tests
   - [ ] CheckIn module unit tests
   - [ ] Services module unit tests
   - [ ] Clubs module unit tests
   - [ ] Registrations module unit tests
   - [ ] Analytics module unit tests

2. **Frontend**:
   - [ ] Component tests (EventCard, ClubCard, PartnerLayout, EventLimitModal, etc.)
   - [ ] Page tests (HomePage, EventsPage, MarketplacePage, MorePage, Partner pages, etc.)
   - [ ] Service tests (API client mocking, partnersService, paymentVerificationService, etc.)
   - [ ] Context tests (AuthContext)
   - [ ] Layout tests (Layout, PartnerLayout, BottomNavigation)

3. **E2E**:
   - [ ] Payment verification flow E2E tests
   - [ ] Partner registration and event creation E2E tests
   - [ ] Gamification flow E2E tests (points, achievements)
   - [ ] Moderation queue E2E tests
   - [ ] Registration flow E2E tests
   - [ ] Check-in flow E2E tests (Type 1 + Type 2)
   - [ ] Admin operations E2E tests
   - [ ] CSI Dashboard E2E tests

### Target Coverage

- Backend: 80% (currently ~45%)
- Frontend: 70% (currently ~20%)
- E2E: 40+ critical flows covered (currently ~15)

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)

---

**Last Updated**: 2025-11-28
**Version**: 1.1 (Updated with new modules)
