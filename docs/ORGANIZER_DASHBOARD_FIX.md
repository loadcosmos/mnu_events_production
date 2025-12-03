# Organizer Dashboard - PENDING_MODERATION Events Fix

**Date:** 2025-12-03
**Issue:** Events created by organizers not showing in their dashboard
**Status:** ✅ RESOLVED

---

## 🐛 Problem Description

When ORGANIZER created an event:
1. Event was created with `status: PENDING_MODERATION`
2. Event **did not appear** in OrganizerPage dashboard
3. Toast message incorrectly said "now visible to students"

### Root Cause

**Backend (`events.service.ts:369-371`):**
```typescript
async getMyEvents(userId: string, page?: number, limit?: number) {
  return this.findAll(page, limit, { creatorId: userId });
}
```

`findAll` has default filter that **excludes PENDING_MODERATION** events (line 158-160):
```typescript
where.status = {
  notIn: ['PENDING_MODERATION'],
};
```

This filter was intended for public event lists, but was also applied to organizers viewing their own events.

---

## ✅ Solution

### 1. Backend Fix (`events.service.ts`)

Changed `getMyEvents` to **bypass** the default status filter:

```typescript
async getMyEvents(userId: string, page?: number, limit?: number) {
  const { skip, take, page: validatedPage } = validatePagination({ page, limit });

  const [events, total] = await Promise.all([
    this.prisma.event.findMany({
      where: { creatorId: userId }, // Show ALL statuses for creator
      skip,
      take,
      orderBy: { startDate: 'desc' },
      include: {
        creator: { ... },
        externalPartner: { ... },
        _count: { ... },
      },
    }),
    this.prisma.event.count({ where: { creatorId: userId } }),
  ]);

  return createPaginatedResponse(events, total, validatedPage, take);
}
```

**Key changes:**
- Direct query instead of calling `findAll`
- No status filter → shows **all events** including PENDING_MODERATION
- Organizers can now see their events waiting for approval

### 2. Frontend Fix (`CreateEventPage.jsx`)

Updated toast message to show correct status:

```javascript
const eventStatus = response.status || response.data?.status;

if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
  toast.success('Event created successfully!', {
    description: 'Your event is now visible to students.',
  });
} else if (eventStatus === 'PENDING_MODERATION') {
  toast.success('Event created!', {
    description: 'Your event is awaiting moderator approval. You can view it in your dashboard.',
  });
} else {
  toast.success('Event created successfully!', {
    description: 'Your event has been created and is now visible to students.',
  });
}
```

**Benefits:**
- Clear feedback about event status
- Organizers know their event needs approval
- No false expectations about visibility

---

## 🧪 Testing

1. **As ORGANIZER:**
   - Create event → status: PENDING_MODERATION
   - Toast: "awaiting moderator approval"
   - Dashboard shows the event with PENDING_MODERATION badge

2. **As MODERATOR/ADMIN:**
   - Create event → status: UPCOMING
   - Toast: "now visible to students"
   - Event immediately visible to all users

---

## 📊 Related Systems

### Moderation Flow
1. ORGANIZER creates event
2. Backend sets `status: PENDING_MODERATION`
3. Backend calls `moderationService.addToQueue()` (line 128)
4. MODERATOR approves via ModerationQueuePage
5. Status changes to `UPCOMING`
6. Event becomes visible to students

### Status Types (EventStatus enum)
- `PENDING_MODERATION` - Waiting for approval
- `UPCOMING` - Approved, visible to students
- `ONGOING` - Event is happening now
- `COMPLETED` - Event finished
- `CANCELLED` - Event cancelled

---

## 🔗 Related Files

**Backend:**
- `backend/src/events/events.service.ts` (lines 369-408)
- `backend/src/events/events.controller.ts` (lines 84-96)
- `backend/prisma/schema.prisma` (EventStatus enum)

**Frontend:**
- `frontend/js/pages/CreateEventPage.jsx` (lines 149-166)
- `frontend/js/pages/OrganizerPage.jsx` (uses getMyEvents)
- `frontend/js/services/eventsService.js` (getMyEvents method)

---

## 💡 Lessons Learned

1. **Default filters** in shared methods can have unexpected side effects
2. **Separate concerns:** Public event lists vs. creator's own events
3. **User feedback** must match actual system behavior
4. **Status visibility** depends on user role and context

---

## 🚀 Deployment

**Commit:** `cc2793c`
**Deployed:** 2025-12-03 via Railway + Vercel
**Verified:** ✅ Events now appear in organizer dashboard
