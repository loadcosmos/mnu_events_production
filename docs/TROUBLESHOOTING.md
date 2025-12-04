# Troubleshooting Guide

**Last Updated:** 2025-12-04  
**Status:** Production Reference

This document consolidates common issues and solutions encountered during development and deployment.

---

## 📧 Email Verification Issues

### Problem: Verification Emails Not Sending

**Symptoms:**
- ✅ User registration succeeds
- ❌ No verification email received
- ❌ Users cannot login (email not verified)

**Root Cause:** Email service misconfiguration

**Solution 1: Using SMTP2GO (Current Production)**

```bash
# Railway environment variables
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=your-smtp2go-username
SMTP_PASS=your-smtp2go-password
SMTP_FROM_NAME=MNU Events
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

**Solution 2: Clean Up Unverified Users**

If users registered before email was fixed:

```sql
-- Connect to Railway PostgreSQL
railway connect Postgres

-- Delete unverified users
DELETE FROM users WHERE "emailVerified" = false;

-- Verify cleanup
SELECT COUNT(*) FROM users WHERE "emailVerified" = false;
-- Should return 0
```

**Why delete?** Users can re-register with working email verification. Cleaner than bulk-verifying potentially fake accounts.

---

## 🎯 Organizer Dashboard

### Problem: Events Not Showing in Dashboard

**Symptoms:**
- Event created successfully
- Toast says "awaiting approval"
- Event not visible in organizer dashboard

**Root Cause:** Default filter excluded PENDING_MODERATION

**Solution:** Backend now shows ALL statuses for creators

```typescript
// backend/src/events/events.service.ts
async getMyEvents(userId: string, page?: number, limit?: number) {
  // Returns ALL events including PENDING_MODERATION
  const events = await this.prisma.event.findMany({
    where: { creatorId: userId }, // No status filter
    orderBy: { startDate: 'desc' },
  });
  return events;
}
```

**Frontend:** Added tabs for Published/Pending/Rejected

- **All Tab:** Shows all events
- **Published Tab:** APPROVED events only
- **Pending Tab:** PENDING_MODERATION events
- **Rejected Tab:** REJECTED events (if any)

---

## 🔒 Authentication & Tokens

### Problem: JWT Token Expired

**Symptoms:**
- User gets logged out unexpectedly
- API returns 401 Unauthorized

**Solution:**
- JWT tokens expire after 1 hour (configurable)
- Refresh tokens valid for 7 days
- Frontend auto-refreshes using refresh token

**Configuration:**
```bash
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

---

## 🎨 UI/UX Issues

### Problem: White Border in Dark Mode

**Symptom:** White glow around header in dark theme on mobile

**Solution:** Removed borders from liquid-glass dark variants

```css
/* frontend/css/globals.css */
.liquid-glass-dark,
.liquid-glass-strong-dark,
.liquid-glass-subtle-dark {
  /* border: removed */
  backdrop-filter: blur(10px);
  ...
}
```

### Problem: QR Scanner Modal Won't Close

**Symptom:** Clicking outside modal doesn't close it

**Solution:** Added backdrop click handler

```jsx
// frontend/js/components/QRScannerModal.jsx
const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    handleClose();
  }
};

<div onClick={handleBackdropClick}>
  <div onClick={(e) => e.stopPropagation()}>
    {/* Modal content */}
  </div>
</div>
```

---

## 🗄️ Database Issues

### Problem: Prisma Client Not Generated

**Symptoms:**
- `@prisma/client` import errors
- "PrismaClient not found"

**Solution:**
```bash
cd backend
npx prisma generate
```

### Problem: Database Connection Failed

**Symptoms:**
- "Can't reach database server"
- Connection timeout

**Solution 1: Check Docker**
```bash
docker ps
# If postgres container not running:
docker-compose up -d
```

**Solution 2: Check DATABASE_URL**
```bash
# Railway production
DATABASE_URL=postgresql://user:pass@host:port/db

# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mnuevents
```

---

## 🚀 Deployment Issues

### Problem: Railway Build Failing

**Common causes:**
1. Node.js version mismatch
2. Missing environment variables
3. Prisma generate not running

**Solution:**
```json
// backend/package.json
{
  "scripts": {
    "build": "nest build",
    "predeploy": "npx prisma generate",
    "deploy": "npm run build"
  }
}
```

### Problem: Vercel 404 Errors

**Symptom:** Refreshing page returns 404

**Solution:** Configure rewrites in `vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 📱 Mobile Issues

### Problem: QR Scanner Camera Not Working

**Causes:**
1. Browser permissions not granted
2. HTTPS required (camera API)
3. Device camera access blocked

**Solution:**
- Ensure HTTPS in production
- Request permissions on user interaction
- Show clear error messages

```javascript
// Check camera permissions
navigator.permissions.query({ name: 'camera' })
  .then(permission => {
    if (permission.state === 'denied') {
      alert('Camera access denied. Please enable in settings.');
    }
  });
```

---

## 🔍 Common Error Messages

### "Email already exists"

**Cause:** User trying to register with existing email

**Solution:** 
- User should login instead
- Or reset password if forgotten

### "Invalid verification code"

**Causes:**
1. Code expired (24h limit)
2. Wrong code entered
3. Code already used

**Solution:**
- Request new code
- Check email for latest code

### "Event is full"

**Cause:** Capacity reached

**Solution:**
- Join waitlist (if implemented)
- Contact organizer
- Check other similar events

---

## 🛠️ Development Tools

### Useful Commands

```bash
# Backend
cd backend
npm run start:dev          # Start dev server
npx prisma studio         # Database GUI
npx prisma db seed        # Seed test data
npx prisma migrate dev    # Run migrations

# Frontend
cd frontend
npm run dev               # Start dev server
npm run build             # Build for production
npm run preview           # Preview build

# Railway
railway link              # Link to project
railway logs              # View logs
railway connect Postgres  # Connect to DB
```

### Database Queries

```sql
-- Check total users
SELECT COUNT(*) FROM users;

-- Check events by status
SELECT
  "moderationStatus",
  COUNT(*) as count
FROM events
GROUP BY "moderationStatus";

-- Check recent registrations
SELECT * FROM registrations
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## 📞 Getting Help

If you encounter an issue not covered here:

1. **Check logs:**
   - Railway: `railway logs`
   - Vercel: Dashboard → Deployments → Logs
   - Browser: DevTools Console

2. **Check documentation:**
   - [README.md](../README.md)
   - [PROJECT_STATUS.md](../PROJECT_STATUS.md)
   - [QR_CHECKIN_SYSTEM.md](QR_CHECKIN_SYSTEM.md)

3. **Check environment:**
   - Verify all env variables are set
   - Check database connection
   - Verify API endpoints accessible

---

**Remember:** Most issues are configuration-related. Double-check environment variables first!
