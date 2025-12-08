# MNU Events Platform

**Modern platform for managing student life at university**

> Unified system for events, clubs, student services, and activity gamification. Developed specifically for Kazakh-German University (KazGUU).

## 📊 Project Status

**Version:** 1.0 (Production Ready)  
**Completion:** 99% ✅  
**Last Updated:** 2025-12-08

| What Works | Status |
|------------|--------|
| 🎓 **Roles** | 5 roles (STUDENT, ORGANIZER, MODERATOR, ADMIN, EXTERNAL_PARTNER) |
| 🎯 **Events** | Registration, 4 types of QR check-in (auto mode), analytics, moderation |
| 🏢 **Partners** | External partner management, 10% commission, event limits |
| 💳 **Payments** | Payment verification for ORGANIZER + EXTERNAL_PARTNER + MODERATOR |
| 🏆 **Gamification** | Points, levels, achievements, CSI Dashboard |
| 💰 **Monetization** | Paid events, advertisements, subscriptions, partner commissions |
| 🛡️ **Moderation** | Queue system, content approval/rejection |
| 🔒 **Security** | 10/10 (JWT httpOnly cookies, CSRF, XSS protection, blacklist, Helmet) |
| 📱 **Interface** | Responsive design, English UI, dark theme support |
| 🌐 **Deployment** | Railway (backend) + Vercel (frontend), CI/CD via Git push |

**Status:** ✅ Production-ready with all security features implemented

---

## 🚀 Deployment

### Production Stack
- **Frontend:** Vercel (https:/mnu-events-production.vercel.app)
- **Backend API:** Railway (https://mnueventsproduction-production.up.railway.app)
- **Database:** Postgres on Railway
- **Email:** SMTP2GO for transactional emails

### Local Development

#### Requirements
- Node.js 20+
- Docker & Docker Compose
- `npm` package manager

#### Quick Start (Recommended)
```bash
# Grant execute permission
chmod +x start.sh
# Run
./start.sh
```

This script automatically starts the database, installs dependencies, applies migrations, and runs frontend/backend servers.

#### Manual Setup
1.  **Start Database (Terminal 1):**
    ```bash
    docker-compose up -d
    ```

2.  **Setup and Run Backend (Terminal 2):**
    ```bash
    cd backend
    npm install
    # For WSL users with bcrypt issues
    npm rebuild bcrypt
    # Copy environment variables
    cp .env.example .env
    # Apply database migrations
    npx prisma migrate dev
    # Generate Prisma client
    npx prisma generate
    # Seed database with test data
    npx prisma db seed
    # Start server
    npm run start:dev
    ```

3.  **Run Frontend (Terminal 3):**
    ```bash
    # Install dependencies (from root)
    npm install
    # Start dev server
    npm run dev
    ```

#### Access Points
-   **Frontend:** `http://localhost:5173`
-   **Backend API:** `http://localhost:3001`
-   **API Documentation (Swagger):** `http://localhost:3001/api/docs`

---

## 🛠️ Configuration

### Backend Environment (`backend/.env`)

Create `backend/.env` from `backend/.env.example`.

#### Production Configuration (Railway)
```bash
# Database
DATABASE_URL="${{Postgres.DATABASE_URL}}"  # Railway auto-injected

# Server Configuration
NODE_ENV="production"
NODE_OPTIONS="--dns-result-order=ipv4first"
PORT="3001"
HOST="0.0.0.0"

# Authentication & Security
JWT_SECRET="88187cb4dbed06827f35e9cf3a56e22cdd18899efc831f131f9f45d0bbab16b6"
JWT_EXPIRATION="1h"
JWT_REFRESH_SECRET="67088a7cb2f16b81f652fe9e190163471be4d743657f925e4fbd1c2faaaad0da"
REFRESH_TOKEN_SECRET="67088a7cb2f16b81f652fe9e190163471be4d743657f925e4fbd1c2faaaad0da"
REFRESH_TOKEN_EXPIRATION="7d"
EMAIL_VERIFICATION_SECRET="cf9c2d41fe040848f4762cff9e8103b4bb52aefeb44e87f73bfa24d38790aec6"
EMAIL_VERIFICATION_EXPIRATION="24h"
PAYMENT_SECRET="1a17c6d2b17c5ca6cfe51430d0fe07de8f9000b9b7c954ea8dbb257f9e75909a"
CSRF_SECRET="5b0a6a610ac6605992c9ab4379f5324f"

# CORS Configuration
CORS_ORIGIN="https://mnu-events-production.vercel.app,https://mnueventsproduction-production.up.railway.app,https://mnu-events-production-*.vercel.app"

# Redis (Upstash)
REDIS_HOST="amazing-stud-43722.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="AarKAAIncDJiNTNiNDFjMTUyYmY0YTkxYjNlMWY4YjJhODRjNTA5ZnAyNDM3MjI"
REDIS_DB="0"
REDIS_TLS="true"

# Email Configuration (SMTP2GO API)
EMAIL_FROM="nurgali_aibar@kazguu.kz"
SMTP2GO_API_KEY="api-0DBA910BC76045A48D625CAE1B2928DD"
SMTP2GO_API_URL="https://api.smtp2go.com/v3/email/send"

# Rate Limiting
THROTTLE_TTL="60"
THROTTLE_LIMIT="100"

# Logging
LOG_LEVEL="info"
LOG_FILE_ENABLED="false"
```

#### Local Development
For local development, copy the production values or use these test values:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mnu_events"
NODE_ENV="development"
JWT_SECRET="dev-secret-key-change-me"
CORS_ORIGIN="http://localhost:5173"
# ... other settings
```

### Test Accounts (after seeding)
-   **Admin:** `admin@kazguu.kz` / `Password123!`
-   **Organizer:** `organizer@kazguu.kz` / `Password123!`
-   **Moderator:** `moderator@kazguu.kz` / `Password123!`
-   **Student:** `student1@kazguu.kz` / `Password123!`

---

## 📚 Documentation

### Core Documentation
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Full project status, development phases, metrics
- **[FEATURES.md](FEATURES.md)** - Complete feature list and user scenarios
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide for Railway and Vercel
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development workflow and testing
- **[paper_draft.md](paper_draft.md)** - Academic capstone project paper

### Recent Updates (December 2025)
- **[docs/UI_UX_MOBILE_OPTIMIZATION.md](docs/UI_UX_MOBILE_OPTIMIZATION.md)** - Mobile responsiveness & INP performance improvements
- **[docs/UI_UX_IMPROVEMENTS_DEC2024.md](docs/UI_UX_IMPROVEMENTS_DEC2024.md)** - UI/UX fixes and translations to English
- **[docs/ADMIN_DASHBOARD_EMAIL_IMPROVEMENTS.md](docs/ADMIN_DASHBOARD_EMAIL_IMPROVEMENTS.md)** - Admin dashboard and email service updates
- **[docs/QR_CHECKIN_SYSTEM.md](docs/QR_CHECKIN_SYSTEM.md)** - Comprehensive QR check-in system documentation
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🎯 Key Features

### For Students
- 📅 Discover and register for events
- 📱 QR code tickets on mobile
- 🏆 Earn points and unlock achievements
- 🎓 Level up: Beginner → Active → Leader → Legend
- 💼 Offer tutoring and services
- 🎨 Find services from other students

### For Organizers (Clubs, Student Council)
- 📢 Create beautifully designed events
- 👥 Track registrations in real-time
- 📊 View analytics (attendance, check-in rates)
- 💰 Accept payments for paid events (via Kaspi)
- 📱 Scan tickets via QR code
- 📈 Advertise events

### For Moderators
- 🛡️ Review student announcements
- ✅ Approve quality content
- ❌ Reject spam and low-quality posts

### For Administrators
- 👨‍💼 Manage all users
- 💰 Configure pricing
-  📊 View platform statistics
- 🎯 Moderate all events and services
- 🏢 Manage external partners
- 📣 **Manage advertisements** (admin-only workflow)

### For External Partners (Companies, Venues)
- 🎪 Create paid events for students
- 💰 Accept payments directly via Kaspi
- 💳 Verify student payments
- 📊 Track sales statistics
- 💵 Pay platform commission (10% default)

---

## 🌟 Recent Improvements

### December 8, 2025 - Code Architecture Improvements
- ✅ **React Query** - Added `@tanstack/react-query` for API caching and request deduplication
- ✅ **Hooks Directory** - New `js/hooks/` with `useEvents`, `useServices`, `useUser` hooks
- ✅ **Pages Reorganization** - Restructured from 45 flat files to 11 categorical folders
- ✅ **HomePage Refactored** - Reduced from 1076 to 280 lines with extracted components
- ✅ **Advertisement System Redesign** - Now admin-only (Company → WhatsApp → Marketing → Admin)
- ✅ **Removed Legacy Code** - Deleted public ad creation page and buttons

### December 4, 2025 - UI/UX Enhancements
- ✅ **Full English Translation** - All UI components translated from Russian
- ✅ **Dark Theme Improvements** - Removed borders, enhanced consistency
- ✅ **Simplified QR Scanner** - Streamlined interface, backdrop click to close
- ✅ **Gamification** - Translated levels, achievements, and date formats
- ✅ **Mobile Navigation** - Added CSI Dashboard access for students
- ✅ **My Clubs Button** - Quick navigation on Events page

### Technical Updates
- ✅ **MarketplacePage** - Fully translated and styled
- ✅ **TutoringPage** - Connected to real API, removed mock data
- ✅ **Backend Achievements** - English translations for gamification
- ✅ **Build Optimization** - All components building successfully

---

## 🚀 Production Deployment

### Railway (Backend)
```bash
# Deploy backend to Railway
railway up
```

### Vercel (Frontend)
```bash
# Deploy frontend to Vercel
vercel --prod
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

---

## 🤝 Contributing

This is a university project. For questions or suggestions, please contact the development team.

---

**Last Updated:** 2025-12-08  
**Version:** 1.2 (React Query + Advertisement System Redesign)  
**Deployment:** Railway (backend) + Vercel (frontend)
