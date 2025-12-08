# Development Guide

Complete development guide for MNU Events Platform - setup, commands, testing, and best practices.

**Last Updated:** 2025-12-08  
**Version:** 3.0 (Consolidated)

---

## 📋 Quick Reference

### Commands Cheat Sheet

```bash
# Quick Start (recommended)
./start.sh

# Backend (cd backend/)
npm run start:dev                    # Dev server (port 3001)
npm run build                        # Production build
npm test                             # Unit tests
npm run lint                         # ESLint
npx prisma migrate dev --name <desc> # DB migration
npx prisma studio                    # DB GUI
npx prisma db seed                   # Seed test data

# Frontend (root directory)
npm run dev                          # Dev server (port 5173)
npm run build                        # Production build
npm run preview                      # Preview production build
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Swagger Docs | http://localhost:3001/api/docs |
| Prisma Studio | http://localhost:5555 (run `npx prisma studio`) |

### Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kazguu.kz | Password123! |
| Organizer | organizer@kazguu.kz | Password123! |
| Moderator | moderator@kazguu.kz | Password123! |
| Student | student1@kazguu.kz | Password123! |

---

## 🚀 Setup & Installation

### System Requirements

- **Node.js:** 20+ (LTS recommended)
- **Docker & Docker Compose:** Latest version
- **Git:** For version control
- **RAM:** 8GB minimum
- **Disk:** 10GB free

### Quick Start (Automated)

```bash
chmod +x start.sh
./start.sh
```

This script handles: database startup, dependencies, migrations, seeding, and server startup.

### Manual Setup

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
npx prisma generate         # Generate client
npx prisma db seed          # Seed test data
npm run start:dev
```

**Terminal 3: Frontend**
```bash
npm install
npm run dev
```

---

## 📁 Project Structure

### Backend (NestJS)

```
backend/src/
├── auth/                 # JWT authentication, email verification
├── users/                # User management (5 roles)
├── events/               # Event CRUD, filtering
├── registrations/        # Event registrations, check-ins
├── clubs/                # Clubs and memberships
├── payments/             # Payment processing
├── payment-verification/ # Receipt approval workflow
├── checkin/              # QR validation (Type 1 + Type 2)
├── services/             # Marketplace services
├── gamification/         # Points, levels, achievements
├── moderation/           # Content moderation queue
├── advertisements/       # Ad system
├── partners/             # External partners management
├── analytics/            # Statistics dashboards
├── common/               # Shared utilities & constants
└── prisma/               # Database service
```

### Frontend (React 19 + Vite)

```
frontend/js/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn-style base components
│   ├── Gamification/    # Level progress, achievement cards
│   ├── Layout.jsx       # Main layout wrapper
│   ├── PartnerLayout.jsx
│   └── ErrorBoundary.jsx
├── pages/                # Route components (12 directories)
│   ├── admin/           # Admin dashboard, users, events
│   ├── auth/            # Login, verify-email
│   ├── clubs/           # Clubs listing, details
│   ├── events/          # Events, create, edit
│   ├── home/            # Hero, marketplace section
│   ├── moderator/       # Moderation queue
│   ├── organizer/       # Organizer dashboard, scanner
│   ├── partner/         # Partner dashboard
│   ├── payments/        # Ticket purchase
│   ├── services/        # Marketplace, service details
│   ├── student/         # Profile, registrations, CSI
│   └── advertisements/
├── hooks/                # React Query hooks (NEW)
│   ├── useEvents.js
│   ├── useServices.js
│   ├── useUser.js
│   └── useClubs.js
├── services/             # API client & domain services
├── context/              # Auth context
└── utils/                # Helpers & constants
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:cov              # With coverage
npm test auth.service.spec.ts # Specific file
```

### Frontend Tests

```bash
npm run test              # Unit tests (if configured)
npx playwright test       # E2E tests
npx playwright test --ui  # E2E with UI
```

### Manual Testing Checklist

Before PRs, verify:

- [ ] Login/Logout works
- [ ] Event creation and registration
- [ ] QR code scanning (mobile)
- [ ] Payment flow (mock)
- [ ] Admin dashboard access
- [ ] No console errors

---

## 🔧 Database Operations

### Prisma Commands

```bash
cd backend

# Create migration after schema change
npx prisma migrate dev --name describe-change

# Apply migrations (production)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database
npx prisma db seed

# Visual database editor
npx prisma studio

# Reset database (DESTRUCTIVE!)
npx prisma migrate reset
```

### Common Patterns

**Add new field to schema:**
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add-field-name`
3. Run `npx prisma generate`

---

## 🎨 UI/UX Guidelines

### Design System (Liquid Glass)

```css
/* Colors */
Background Dark:     #0a0a0a
Background Medium:   #1a1a1a
Background Light:    #2a2a2a
Text Primary:        #ffffff
Text Secondary:      #a0a0a0
Accent Red:          #d62e1f
Accent Red Hover:    #b91c1c
```

### Component Patterns

```jsx
// Primary Button
<button className="bg-[#d62e1f] hover:bg-[#b91c1c] text-white font-bold py-2 px-4 rounded-lg">
  Action
</button>

// Glass Card
<div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-[#2a2a2a] rounded-lg p-6">
  Content
</div>
```

### Responsive Breakpoints

```
Mobile:    < 640px  (sm)
Tablet:    640px+   (md)
Desktop:   1024px+  (lg)
Wide:      1280px+  (xl)
```

---

## ✅ Pre-commit Checklist

### Backend Changes
- [ ] `npm run build` - No TypeScript errors
- [ ] `npm run lint` - ESLint passes
- [ ] `npm test` - Tests pass
- [ ] New endpoints have Swagger decorators
- [ ] Authorization guards on protected routes

### Frontend Changes
- [ ] `npm run build` - Production build succeeds
- [ ] No console errors
- [ ] Responsive design tested
- [ ] Dark theme support
- [ ] Using React Query hooks for API calls

### Git Commit
- [ ] Clear commit message: `type(scope): description`
- [ ] Types: `feat`, `fix`, `refactor`, `docs`, `test`
- [ ] No debug code (console.log, debugger)

---

## 🐛 Troubleshooting

### Common Issues

**bcrypt Installation Fails (WSL)**
```bash
cd backend && npm rebuild bcrypt
```

**Database Connection Refused**
```bash
docker-compose up -d postgres
sleep 5
npx prisma generate
```

**Port Already in Use**
```bash
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Prisma Client Not Found**
```bash
cd backend && npx prisma generate
```

**Frontend Hot Reload Not Working**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### More Issues

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for:
- Email verification problems
- Dashboard visibility issues
- Deployment issues (Railway, Vercel)

---

## 📚 Related Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview, quick start |
| [CLAUDE.md](CLAUDE.md) | AI agent context (commands, paths) |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Full status, roadmap, metrics |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Production deployment |
| [docs/QR_CHECKIN_SYSTEM.md](docs/QR_CHECKIN_SYSTEM.md) | QR system technical docs |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues & solutions |

---

## 🔗 Docker Commands Reference

```bash
# Start all services
docker-compose up -d

# Start only database
docker-compose up -d postgres

# View logs
docker-compose logs -f

# Stop services (keep data)
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v

# Access container shell
docker-compose exec backend sh

# Run command in container
docker-compose exec backend npx prisma studio
```

---

**Environment Variables:** See `backend/.env.example` for all configuration options.

**Support:** Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) first, then create GitHub issue.
