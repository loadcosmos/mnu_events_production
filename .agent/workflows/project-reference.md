---
description: Project architecture and key file locations reference
---

# MNU Events Project Reference

## Project Structure

```
mnu_events_production/
├── frontend/                    # React frontend (Vite)
│   ├── js/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # shadcn/ui components (button, input, etc.)
│   │   │   ├── EventCard.jsx    # Event display card
│   │   │   ├── ImageUploadCrop.jsx  # Universal image upload with cropping
│   │   │   ├── EventModal.jsx   # Event details modal
│   │   │   └── Gamification/    # Gamification components
│   │   ├── pages/               # Page components (organized by role/feature)
│   │   │   ├── admin/           # Admin dashboard, users, events, pricing
│   │   │   ├── auth/            # Login, VerifyEmail
│   │   │   ├── clubs/           # ClubsPage, ClubDetailsPage
│   │   │   ├── events/          # EventsPage, EventDetails, CreateEvent, EditEvent
│   │   │   ├── home/            # HomePage components
│   │   │   ├── moderator/       # Moderation dashboard
│   │   │   ├── organizer/       # Organizer dashboard, scanner
│   │   │   ├── partner/         # External partner pages
│   │   │   ├── payments/        # Ticket purchase, payment flow
│   │   │   ├── services/        # Marketplace, CreateService
│   │   │   └── student/         # Profile, registrations, CSI
│   │   ├── services/            # API service clients
│   │   │   ├── apiClient.js     # Axios wrapper with interceptors
│   │   │   ├── authService.js   # Authentication
│   │   │   ├── eventsService.js # Events CRUD
│   │   │   ├── usersService.js  # Users + avatar upload
│   │   │   ├── uploadService.js # Generic image uploads (NEW)
│   │   │   └── ...
│   │   ├── hooks/               # React Query hooks
│   │   ├── context/             # AuthContext, ThemeContext
│   │   └── utils/               # Utilities (sanitize, formatters)
│   └── package.json             # Frontend dependencies (Vercel uses this)
│
├── backend/                     # NestJS backend
│   ├── src/
│   │   ├── auth/                # Authentication module
│   │   ├── users/               # Users module + avatar upload endpoint
│   │   ├── events/              # Events module
│   │   ├── clubs/               # Clubs module
│   │   ├── services/            # Marketplace services module
│   │   ├── cloudinary/          # Image upload module (NEW)
│   │   │   ├── cloudinary.module.ts
│   │   │   ├── cloudinary.provider.ts
│   │   │   ├── cloudinary.service.ts
│   │   │   └── upload.controller.ts
│   │   ├── prisma/              # Prisma module
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── Dockerfile               # Production Docker image
│   └── package.json             # Backend dependencies
│
├── docs/                        # Documentation
├── PROJECT_STATUS.md            # Current project status
├── README.md                    # Quick start guide
└── .agent/workflows/            # AI agent reference files
```

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login, sets httpOnly cookies
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get current user

### Image Upload (Cloudinary)
- `POST /api/users/me/avatar` - Upload user avatar (400x400, face-detect)
- `POST /api/upload/event/:id` - Upload event banner (1200x675)
- `POST /api/upload/service/:id` - Upload service image (800x600)
- `POST /api/upload/club/:id` - Upload club logo (400x400)
- `POST /api/upload/image` - Generic image upload

### Events
- `GET /api/events` - List events (with filters, pagination)
- `POST /api/events` - Create event (ORGANIZER+)
- `GET /api/events/:id` - Get event details
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## User Roles

| Role | Can Create Events | Can Moderate | Can Upload Images | Notes |
|------|-------------------|--------------|-------------------|-------|
| STUDENT | ❌ | ❌ | Avatar only | Can register for events |
| ORGANIZER | ✅ | ❌ | Events, Services | Club management |
| MODERATOR | ❌ | ✅ | ❌ | Approve/reject content |
| ADMIN | ✅ | ✅ | All | Full access |
| EXTERNAL_PARTNER | ✅ | ❌ | Events | External event organizers |
| FACULTY | ❌ | ❌ | Avatar only | Teachers, auto-approved posts |

## Database Models (Key)

### User
- id, email, firstName, lastName, avatar, faculty, position (FACULTY only)
- role: STUDENT | ORGANIZER | MODERATOR | ADMIN | EXTERNAL_PARTNER | FACULTY

### Event
- id, title, description, category, imageUrl, startDate, endDate
- organizerId, status (PENDING_MODERATION | APPROVED | REJECTED)

### New Social Models (schema ready, not yet fully implemented)
- UserPreference - interests, CSI tags
- Post, PostLike, PostComment - social posts
- SavedEvent - bookmarked events
- UserFollow - following system

## Environment Variables

### Backend (Railway)
```
DATABASE_URL       - PostgreSQL connection string
CLOUDINARY_URL     - cloudinary://API_KEY:API_SECRET@CLOUD_NAME
JWT_SECRET         - JWT signing key
REFRESH_TOKEN_SECRET
CSRF_SECRET
REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
```

### Frontend (Vercel)
```
VITE_API_URL       - Backend API URL (e.g., https://api.example.com/api)
```

## Common Tasks

### Add image upload to a form
1. Import `ImageUploadCrop` and `uploadService`
2. Add `uploadingImage` state
3. Create handler that calls `uploadService.uploadImage(file)`
4. Replace URL input with `<ImageUploadCrop onUpload={handler} />`

### Deploy changes
1. `git add -A && git commit -m "message"`
2. `git push origin main`
3. Railway auto-deploys backend, Vercel auto-deploys frontend

### Check Railway deployment status
- Use `mcp_list-deployments` tool
- Use `mcp_get-logs` tool for logs

### Database changes
1. Modify `backend/prisma/schema.prisma`
2. Local: `npx prisma db push` or `npx prisma migrate dev`
3. Railway: Dockerfile runs `prisma db push` on startup
