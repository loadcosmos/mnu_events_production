# Email Verification Issue - Troubleshooting Guide

**Date:** 2025-12-03  
**Status:** 🔧 In Progress  
**Issue:** Verification emails not being sent, users cannot login

---

## 🐛 Problem Description

### Symptoms
1. ✅ User registration creates account in database
2. ❌ Verification code email is NOT sent (but UI shows success)
3. ❌ Users cannot login - error: "Please verify your email first"
4. ✅ Users exist in Admin Dashboard
5. ❌ Duplicate registration attempts show "User already exists"

### Root Cause

**Email service is configured with Resend API, but emails are failing silently.**

The issue is in `/backend/src/config/configuration.ts` line 50:
```typescript
from: process.env.EMAIL_FROM || 'noreply@mnuevents.kz',
```

**Problem:** The domain `mnuevents.kz` is NOT verified in Resend, so emails fail to send.

---

## ✅ Solution 1: Use Resend Test Domain (IMMEDIATE FIX)

### Changes Made

**File:** `backend/src/config/configuration.ts:50`

**Before:**
```typescript
from: process.env.EMAIL_FROM || 'noreply@mnuevents.kz',
```

**After:**
```typescript
from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
```

### Why This Works
- `onboarding@resend.dev` is Resend's official test domain
- No domain verification required
- Emails will be sent successfully
- ⚠️ Only works for development/testing

### Deploy This Fix

```bash
# 1. Commit changes
cd /home/loadcosmos/mnu_events_production
git add backend/src/config/configuration.ts
git commit -m "fix: Use Resend test domain for email sending"
git push

# 2. Redeploy backend on Railway
# (Railway auto-deploys on git push if connected)

# OR manually redeploy:
railway up
```

---

## ✅ Solution 2: Add EMAIL_FROM to Railway Variables (RECOMMENDED)

Instead of changing code, you can set the environment variable in Railway:

### Steps

1. **Go to Railway Dashboard** → Your Backend Service → Variables
2. **Add Variable:**
   ```
   EMAIL_FROM=onboarding@resend.dev
   ```
3. **Redeploy backend**

This way you don't need to modify code.

---

## ✅ Solution 3: Verify Your Custom Domain in Resend (PRODUCTION)

### For Production Use

1. **Go to Resend Dashboard:** https://resend.com/domains
2. **Add Domain:** `mnuevents.kz`
3. **Add DNS Records** (provided by Resend):
   - SPF record
   - DKIM record
   - DMARC record (optional)
4. **Wait for verification** (usually 5-15 minutes)
5. **Set EMAIL_FROM in Railway:**
   ```
   EMAIL_FROM=noreply@mnuevents.kz
   ```

### Alternative: Use Resend Subdomain

If you don't own `mnuevents.kz`, you can use a subdomain from your actual domain:

1. Add your actual domain to Resend (e.g., `yourdomain.com`)
2. Use `noreply@yourdomain.com` or `events@yourdomain.com`

---

## 🔧 Solution 4: Verify Existing Users (IMMEDIATE)

Since users already exist in database but `emailVerified = false`, you need to manually verify them.

### Option A: Use Admin Dashboard API

```bash
# Get user ID from Admin Dashboard
# Then call the verify endpoint:

curl -X PATCH https://your-backend.railway.app/api/users/{USER_ID}/verify-email \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Option B: Direct Database Update (Quick Fix)

**⚠️ ONLY USE IF YOU TRUST THESE USERS**

```sql
-- Connect to Railway PostgreSQL
-- Update specific users by email:
UPDATE "User"
SET "emailVerified" = true,
    "verificationCode" = NULL,
    "verificationCodeExpiry" = NULL
WHERE email IN ('user1@example.com', 'user2@example.com');

-- Verify:
SELECT id, email, "emailVerified" FROM "User" WHERE email IN ('user1@example.com', 'user2@example.com');
```

### Option C: Create Admin Script

Create a file `backend/scripts/verify-users.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyUsers(emails: string[]) {
  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: emails,
      },
    },
    data: {
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    },
  });

  console.log(`✅ Verified ${result.count} users`);
}

// Usage
verifyUsers([
  'user1@email.com',
  'user2@email.com',
]).then(() => prisma.$disconnect());
```

Run it:
```bash
cd backend
npx ts-node scripts/verify-users.ts
```

---

## 📋 Testing After Fix

### 1. Test Email Sending

```bash
# Call the email status endpoint
curl https://your-backend.railway.app/api/auth/email-status

# Expected response:
{
  "configured": true,
  "provider": "Resend",
  "apiKeySet": true,
  "emailFrom": "onboarding@resend.dev",
  "message": "Email service is configured and ready (Resend)"
}
```

### 2. Test New Registration

1. Register a new user with a real email
2. Check email inbox for verification code
3. Verify email with code
4. Login successfully

### 3. Monitor Backend Logs

Check Railway logs for email sending:

```
✅ Verification email sent successfully for user: <USER_ID>
```

Or errors:
```
❌ Failed to send verification email for user: <USER_ID>
```

---

## 🚨 Current Railway Variables Check

Your current Railway variables show:
```
RESEND_API_KEY=re_KzL5j11a_NsK4gUAuotoYMkvrfVheHtVx  ✅
```

**Missing:**
```
EMAIL_FROM=onboarding@resend.dev  ❌ (needs to be added)
```

---

## 🔍 How to Debug

### Check Backend Logs for Resend Errors

Look for logs like:
```
Email sending failed via Resend: {
  message: "Domain not verified",
  name: "Error"
}
```

### Check Resend Dashboard

1. Go to https://resend.com/emails
2. Check if emails are showing as "Failed"
3. Click on failed emails to see error details

### Test Resend API Directly

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_KzL5j11a_NsK4gUAuotoYMkvrfVheHtVx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test</p>"
  }'
```

---

## ✅ Recommended Action Plan

### Step 1: Immediate Fix (5 minutes)
1. ✅ **DONE:** Changed `configuration.ts` to use `onboarding@resend.dev`
2. **TODO:** Commit and push to Railway
3. **TODO:** Wait for auto-deploy (or trigger manual deploy)

### Step 2: Verify Existing Users (10 minutes)
1. Get email addresses of affected users from Admin Dashboard
2. Use Option B (SQL) or Option C (script) to verify them
3. Notify users they can now login

### Step 3: Test (5 minutes)
1. Register new test user
2. Check email arrives
3. Verify and login

### Step 4: Production Setup (Later)
1. Add your domain to Resend
2. Configure DNS records
3. Update `EMAIL_FROM` to your custom domain

---

## 📞 Support Resources

- **Resend Documentation:** https://resend.com/docs
- **Resend Status:** https://status.resend.com
- **Domain Verification Guide:** https://resend.com/docs/dashboard/domains/add-domain

---

**Last Updated:** 2025-12-03  
**Status:** ✅ Fix applied, waiting for deployment
