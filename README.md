# MNU Events Platform

**Modern platform for managing student life at university**

> Unified system for events, clubs, student services, and activity gamification. Developed specifically for Kazakh-German University (KazGUU).

## 📊 Project Status

**Version:** 1.0 (Production Ready)  
**Completion:** 99% ✅  
**Last Updated:** 2025-12-04

| What Works | Status |
|------------|--------|
| 🎓 **Roles** | 5 roles (STUDENT, ORGANIZER, MODERATOR, ADMIN, EXTERNAL_PARTNER) |
| 🎯 **Events** | Registration, 4 types of QR check-in (auto mode), analytics, moderation |
| 🏢 **Partners** | External partner management, 10% commission, event limits |
| 💳 **Payments** | Payment verification for ORGANIZER + EXTERNAL_PARTNER + MODERATOR |
| 🏆 **Gamification** | Points, levels, achievements, CSI Dashboard |
| 💰 **Monetization** | Paid events, advertisements, subscriptions, partner commissions |
| 🛡️ **Moderation** | Queue system, content approval/rejection |
| 🔒 **Security** | 9/10 (partner system secured, roles verified) |
| 📱 **Interface** | Responsive design, English UI, dark theme support |
| 🌐 **Deployment** | Railway (backend) + Vercel (frontend) |

**Status:** ✅ Production-ready

---

## 🚀 Deployment

### Production Stack
- **Frontend:** Vercel (https://your-app.vercel.app)
- **Backend API:** Railway (https://your-api.railway.app)
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

#### Authentication & Security
```bash
# JWT token signing keys (generate secure random strings)
JWT_SECRET=your-secret-key-change-in-production
REFRESH_TOKEN_SECRET=your-refresh-secret-change-in-production
EMAIL_VERIFICATION_SECRET=your-verification-secret-change-in-production

# Payment signing secret (for QR codes, etc.)
PAYMENT_SECRET=your-payment-secret-key

# Token expiration
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

#### Email Configuration (SMTP2GO)
```bash
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=your-smtp2go-username
SMTP_PASS=your-smtp2go-password
SMTP_FROM_NAME=MNU Events
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

#### Database (Railway Production)
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
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

###Recent Updates (December 2024)
- **[docs/UI_UX_IMPROVEMENTS_DEC2024.md](docs/UI_UX_IMPROVEMENTS_DEC2024.md)** - UI/UX fixes and translations to English
- **[docs/ADMIN_DASHBOARD_EMAIL_IMPROVEMENTS.md](docs/ADMIN_DASHBOARD_EMAIL_IMPROVEMENTS.md)** - Admin dashboard and email service updates
- **[docs/QR_CHECKIN_SYSTEM.md](docs/QR_CHECKIN_SYSTEM.md)** - Comprehensive QR check-in system documentation

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

### For External Partners (Companies, Venues)
- 🎪 Create paid events for students
- 💰 Accept payments directly via Kaspi
- 💳 Verify student payments
- 📊 Track sales statistics
- 💵 Pay platform commission (10% default)

---

## 🌟 Recent Improvements (December 2024)

### UI/UX Enhancements
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

**Last Updated:** 2025-12-04  
**Version:** 1.0 (Production Ready - Full English UI)  
**Deployment:** Railway + Vercel
