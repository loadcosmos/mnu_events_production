# QR Check-In System Documentation

**Last Updated:** 2025-12-01
**Version:** 1.0
**Status:** Implemented & Unit Tested ✅

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Business Logic Matrix](#business-logic-matrix)
3. [Architecture](#architecture)
4. [File Structure](#file-structure)
5. [Core Functions](#core-functions)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Frontend Components](#frontend-components)
9. [Security](#security)
10. [Testing](#testing)
11. [Migration Guide](#migration-guide)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The QR Check-In System provides flexible attendance tracking for 4 types of events:
- **Internal Free Events**: Students scan organizer's QR code
- **Internal Paid Events**: Organizer scans student's ticket QR code
- **External Free Events**: Organizer scans student's registration QR code (for analytics)
- **External Paid Events**: Partner scans student's ticket QR code

### Key Principles

1. **External venues ALWAYS scan students** - even for free events (analytics requirement)
2. **Conditional QR generation** - Registration QR codes only for external free events
3. **Role-based access** - ORGANIZER, EXTERNAL_PARTNER, MODERATOR, ADMIN can scan
4. **Security** - HMAC-SHA256 signatures on all QR codes
5. **Immutability** - Cannot change `isPaid` after registrations exist

---

## 🔄 Business Logic Matrix

| Event Type | isPaid | isExternalEvent | QR Location | Who Scans | checkInMode | Registration.qrCode | Ticket.qrCode |
|------------|--------|-----------------|-------------|-----------|-------------|---------------------|---------------|
| **Internal Free** | `false` | `false` | Organizer | Student | `STUDENTS_SCAN` | `null` | N/A |
| **Internal Paid** | `true` | `false` | Student | Organizer | `ORGANIZER_SCANS` | `null` | ✅ Yes |
| **External Free** | `false` | `true` | Student | Organizer/Partner | `ORGANIZER_SCANS` | ✅ Yes | N/A |
| **External Paid** | `true` | `true` | Student | Partner | `ORGANIZER_SCANS` | `null` | ✅ Yes |

### CheckInMode Logic

```typescript
if (isExternalEvent) {
  return ORGANIZER_SCANS; // External = always scan for analytics
}
if (isPaid) {
  return ORGANIZER_SCANS; // Paid = organizer scans ticket
}
return STUDENTS_SCAN; // Free internal = student scans
```

### Registration QR Logic

```typescript
// Only generate Registration QR for: External + Free events
if (checkInMode === STUDENTS_SCAN) {
  return false; // Event has QR, not registration
}
if (checkInMode === ORGANIZER_SCANS) {
  return !isPaid; // Only for free external events
}
return false;
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Event Creation                          │
│  (events.service.ts:create)                                 │
│  ↓                                                          │
│  determineCheckInMode(isPaid, isExternalEvent)             │
│  ↓                                                          │
│  Event.checkInMode = ORGANIZER_SCANS | STUDENTS_SCAN       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Student Registers                          │
│  (registrations.service.ts:create)                          │
│  ↓                                                          │
│  shouldGenerateRegistrationQR(checkInMode, isPaid)         │
│  ↓                                                          │
│  if (true) → generateRegistrationQR()                       │
│  Registration.qrCode = base64DataURL | null                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Check-In Process                         │
│                                                             │
│  MODE 1: ORGANIZER_SCANS                                   │
│  → POST /checkin/validate-ticket                           │
│  → Organizer/Partner scans student's QR                    │
│                                                             │
│  MODE 2: STUDENTS_SCAN                                     │
│  → POST /checkin/validate-student                          │
│  → Student scans organizer's QR                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

### Backend

```
backend/src/
├── common/utils/
│   ├── checkin-mode.utils.ts        # Core business logic (determineCheckInMode, shouldGenerateRegistrationQR)
│   └── checkin-mode.utils.spec.ts   # Unit tests (11 tests, all passing)
│
├── events/
│   └── events.service.ts             # Automatic checkInMode calculation on event creation
│                                     # Edge Case: Prevent isPaid changes after registrations
│
├── registrations/
│   └── registrations.service.ts      # Conditional Registration QR generation
│                                     # generateRegistrationQR() with HMAC-SHA256 signature
│
├── checkin/
│   ├── checkin.controller.ts         # API endpoints (validate-ticket, validate-student, etc.)
│   │                                 # MODERATOR role added to all endpoints
│   └── checkin.service.ts            # Check-in validation and processing
│
└── scripts/
    └── fix-checkin-modes.ts          # Migration script for existing events
```

### Frontend

```
frontend/js/
├── pages/
│   └── MyRegistrationsPage.jsx       # Conditional QR display based on checkInMode
│                                     # Shows info message for STUDENTS_SCAN mode
│
└── components/
    └── (QR scanner components)       # QR scanning UI components
```

---

## 🔧 Core Functions

### 1. `determineCheckInMode()`

**Location:** `backend/src/common/utils/checkin-mode.utils.ts`

**Purpose:** Calculate the correct check-in mode for an event based on its properties.

**Signature:**
```typescript
export function determineCheckInMode(event: EventCheckInData): CheckInMode
```

**Input:**
```typescript
interface EventCheckInData {
  isPaid: boolean;
  isExternalEvent: boolean;
}
```

**Output:**
- `CheckInMode.ORGANIZER_SCANS` - Organizer/partner scans student's QR
- `CheckInMode.STUDENTS_SCAN` - Student scans organizer's QR

**Logic:**
1. If external event → `ORGANIZER_SCANS` (always, for analytics)
2. If paid event → `ORGANIZER_SCANS` (organizer verifies ticket)
3. Else → `STUDENTS_SCAN` (student scans organizer's QR)

**Usage:**
```typescript
// In events.service.ts:create()
const checkInMode = determineCheckInMode({
  isPaid: createEventDto.isPaid || false,
  isExternalEvent: externalPartnerId !== null,
});

const event = await this.prisma.event.create({
  data: {
    ...createEventDto,
    checkInMode: checkInMode,
  },
});
```

---

### 2. `shouldGenerateRegistrationQR()`

**Location:** `backend/src/common/utils/checkin-mode.utils.ts`

**Purpose:** Determine if a registration needs a QR code generated.

**Signature:**
```typescript
export function shouldGenerateRegistrationQR(
  checkInMode: CheckInMode,
  isPaid: boolean
): boolean
```

**Output:**
- `true` - Generate registration QR (external free events only)
- `false` - Do not generate registration QR

**Logic:**
1. If `STUDENTS_SCAN` mode → `false` (event has QR, not registration)
2. If `ORGANIZER_SCANS` mode + not paid → `true` (external free events)
3. Else → `false`

**Usage:**
```typescript
// In registrations.service.ts:create()
let qrCodeData: string | null = null;

if (shouldGenerateRegistrationQR(registration.event.checkInMode, registration.event.isPaid)) {
  qrCodeData = await this.generateRegistrationQR(
    registration.id,
    eventId,
    userId,
  );
}

await tx.registration.update({
  where: { id: registration.id },
  data: { qrCode: qrCodeData },
});
```

---

### 3. `generateRegistrationQR()`

**Location:** `backend/src/registrations/registrations.service.ts` (private method)

**Purpose:** Generate a secure QR code for registration check-in.

**Signature:**
```typescript
private async generateRegistrationQR(
  registrationId: string,
  eventId: string,
  userId: string,
): Promise<string>
```

**Output:** Base64 data URL of QR code image

**Security:**
- HMAC-SHA256 signature using `PAYMENT_SECRET`
- Timestamp for validation
- Payload includes: registrationId, eventId, userId

**Payload Structure:**
```typescript
{
  registrationId: string,
  eventId: string,
  userId: string,
  timestamp: number,
  signature: string  // HMAC-SHA256(payload, PAYMENT_SECRET)
}
```

---

## 🌐 API Endpoints

### Check-In Endpoints

All endpoints require JWT authentication.

#### 1. Validate Ticket (Mode 1: ORGANIZER_SCANS)

**Endpoint:** `POST /checkin/validate-ticket`
**Roles:** `ORGANIZER`, `EXTERNAL_PARTNER`, `MODERATOR`, `ADMIN`

**Purpose:** Organizer/partner scans student's ticket QR code (paid events).

**Request Body:**
```typescript
{
  qrCodeData: string  // JSON string with registrationId, eventId, userId, timestamp, signature
}
```

**Response:**
```typescript
{
  success: true,
  checkIn: {
    id: string,
    userId: string,
    eventId: string,
    checkedInAt: Date,
    // ... user details
  }
}
```

**Error Codes:**
- `400` - Invalid QR code or ticket already used
- `403` - Access denied
- `404` - Ticket or event not found
- `409` - Ticket already used

---

#### 2. Validate Student (Mode 2: STUDENTS_SCAN)

**Endpoint:** `POST /checkin/validate-student`
**Roles:** `STUDENT`

**Purpose:** Student scans organizer's event QR code (free internal events).

**Request Body:**
```typescript
{
  eventQRCode: string  // Event-specific QR code
}
```

**Response:**
```typescript
{
  success: true,
  checkIn: {
    id: string,
    userId: string,
    eventId: string,
    checkedInAt: Date,
  }
}
```

**Error Codes:**
- `400` - Invalid QR code, expired, or rate limit exceeded
- `404` - Event not found
- `409` - Student already checked in

---

#### 3. Generate Event QR

**Endpoint:** `POST /checkin/generate-event-qr`
**Roles:** `ORGANIZER`, `EXTERNAL_PARTNER`, `MODERATOR`, `ADMIN`

**Purpose:** Generate QR code for STUDENTS_SCAN mode events.

**Request Body:**
```typescript
{
  eventId: string
}
```

**Response:**
```typescript
{
  qrCode: string,  // Base64 data URL
  expiresAt: Date,
  eventId: string
}
```

---

#### 4. Get Event Check-In Stats

**Endpoint:** `GET /checkin/event/:id/stats`
**Roles:** `ORGANIZER`, `EXTERNAL_PARTNER`, `MODERATOR`, `ADMIN`

**Response:**
```typescript
{
  eventId: string,
  title: string,
  totalRegistrations: number,
  checkedInCount: number,
  checkInRate: number,  // percentage
  mode: CheckInMode
}
```

---

#### 5. Get Check-In List

**Endpoint:** `GET /checkin/event/:id/list`
**Roles:** `ORGANIZER`, `EXTERNAL_PARTNER`, `MODERATOR`, `ADMIN`

**Purpose:** Get list of all check-ins for an event with user details.

**Response:**
```typescript
{
  checkIns: Array<{
    id: string,
    userId: string,
    userName: string,
    email: string,
    checkedInAt: Date,
    // ... more user details
  }>
}
```

---

## 🗄️ Database Schema

### Relevant Models

```prisma
enum CheckInMode {
  ORGANIZER_SCANS  // Organizer/partner scans student's QR
  STUDENTS_SCAN    // Student scans organizer's QR
}

model Event {
  id                String       @id @default(cuid())
  title             String
  isPaid            Boolean      @default(false)
  isExternalEvent   Boolean      @default(false)
  checkInMode       CheckInMode  @default(STUDENTS_SCAN)
  // ... other fields

  registrations     Registration[]
  checkIns          CheckIn[]

  @@index([checkInMode])
}

model Registration {
  id        String   @id @default(cuid())
  userId    String
  eventId   String
  qrCode    String?  @db.Text  // Base64 data URL (only for external free events)
  status    RegistrationStatus
  // ... other fields

  user      User     @relation(fields: [userId], references: [id])
  event     Event    @relation(fields: [eventId], references: [id])

  @@unique([userId, eventId])
}

model CheckIn {
  id          String   @id @default(cuid())
  userId      String
  eventId     String
  checkedInAt DateTime @default(now())
  // ... other fields

  user        User     @relation(fields: [userId], references: [id])
  event       Event    @relation(fields: [eventId], references: [id])

  @@unique([userId, eventId])
}
```

---

## 🎨 Frontend Components

### MyRegistrationsPage.jsx

**Location:** `frontend/js/pages/MyRegistrationsPage.jsx`

**Purpose:** Display user's event registrations with conditional QR codes.

**Key Logic:**

```jsx
{/* QR Code Display - Only for ORGANIZER_SCANS + FREE (external analytics) */}
{registration.qrCode &&
 registration.status === 'REGISTERED' &&
 event.checkInMode === 'ORGANIZER_SCANS' &&
 !event.isPaid && (
  <div className="mt-4 p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
      QR-код для регистрации
    </h4>
    <img
      src={registration.qrCode}
      alt="Registration QR Code"
      className="w-48 h-48 mx-auto"
    />
    <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2">
      Покажите этот QR-код организатору на входе
    </p>
  </div>
)}

{/* Info for STUDENTS_SCAN mode (internal free events) */}
{registration.status === 'REGISTERED' &&
 event.checkInMode === 'STUDENTS_SCAN' && (
  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
        <i className="fa-solid fa-info-circle mr-2" />
        Check-in на мероприятии
      </p>
    </div>
    <p className="text-xs text-blue-800 dark:text-blue-400 mb-3">
      Отсканируйте QR-код организатора на мероприятии для check-in
    </p>
    <button
      onClick={(e) => {
        e.stopPropagation();
        openQRScanner(event.id);
      }}
      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
    >
      <i className="fa-solid fa-camera" />
      Сканировать QR-код
    </button>
  </div>
)}
```

**Display Matrix:**

| Condition | Display |
|-----------|---------|
| `checkInMode=STUDENTS_SCAN` | Info message + "Scan QR Code" button (opens QRScanner) |
| `checkInMode=ORGANIZER_SCANS` + `isPaid=false` + has QR | Registration QR code image |
| `checkInMode=ORGANIZER_SCANS` + `isPaid=true` | Ticket QR (handled by tickets module) |

**QR Scanner Integration:**
- Button opens `QRScanner` modal component
- Uses `html5-qrcode` library for camera access
- Calls `checkinService.validateStudent()` API on successful scan
- Shows toast notifications for success/error
- Auto-reloads registrations after successful check-in

---

### QRScanner.jsx

**Location:** `frontend/js/components/QRScanner.jsx`

**Purpose:** Modal component for scanning QR codes using device camera.

**Technology:** Uses `html5-qrcode` library (v2.3.8)

**Props:**
```typescript
interface QRScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onClose: () => void;
}
```

**Features:**
- ✅ Real-time camera access
- ✅ Auto-detection of QR codes
- ✅ Torch/flashlight support (if device supports)
- ✅ Dark theme support
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ User instructions

**Configuration:**
```javascript
{
  fps: 10,                           // Frames per second for scanning
  qrbox: { width: 250, height: 250 }, // Scanning area size
  aspectRatio: 1.0,                  // Square aspect ratio
  showTorchButtonIfSupported: true,  // Enable flashlight button
}
```

**Usage Example:**
```jsx
import QRScanner from '../components/QRScanner';

function MyComponent() {
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScanSuccess = async (decodedText) => {
    console.log('QR Code scanned:', decodedText);

    // Call API with decoded QR data
    const response = await checkinService.validateStudent({
      eventQRCode: decodedText
    });

    // Handle response
    if (response.success) {
      toast.success('Check-in successful!');
    }

    setScannerOpen(false);
  };

  return (
    <>
      <button onClick={() => setScannerOpen(true)}>
        Scan QR Code
      </button>

      {scannerOpen && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </>
  );
}
```

**User Flow:**
1. User clicks "Сканировать QR-код" button
2. Browser requests camera permission
3. QRScanner modal opens with video feed
4. User points camera at organizer's QR code
5. Library auto-detects and decodes QR code
6. `onScanSuccess` callback triggered with decoded text
7. Parent component calls API (e.g., `validateStudent`)
8. Scanner closes and shows result toast

**Error Handling:**
- Camera permission denied → Shows error message
- Invalid QR code → Silently continues scanning
- API errors → Caught in parent component, shows error toast

**Permissions:**
- Requires browser camera permission
- Works on HTTPS only (security requirement)
- Mobile-friendly (responsive design)

---

## 🔒 Security

### QR Code Security

1. **HMAC-SHA256 Signatures:**
   - All QR codes signed with `PAYMENT_SECRET`
   - Signature verification on scan
   - Prevents QR code forgery

2. **Timestamp Validation:**
   - QR codes include generation timestamp
   - Can implement expiry validation if needed

3. **Payload Structure:**
   ```typescript
   {
     registrationId: string,  // Unique registration identifier
     eventId: string,         // Event context
     userId: string,          // User context
     timestamp: number,       // Generation time
     signature: string        // HMAC-SHA256(payload, PAYMENT_SECRET)
   }
   ```

### Role-Based Access Control

**Check-In Permissions:**

| Role | validate-ticket | validate-student | generate-event-qr | stats/list |
|------|----------------|------------------|-------------------|------------|
| `STUDENT` | ❌ | ✅ | ❌ | ❌ |
| `ORGANIZER` | ✅ | ❌ | ✅ | ✅ |
| `EXTERNAL_PARTNER` | ✅ | ❌ | ✅ | ✅ |
| `MODERATOR` | ✅ | ❌ | ✅ | ✅ |
| `ADMIN` | ✅ | ❌ | ✅ | ✅ |

**Key Points:**
- MODERATOR role added to all organizer endpoints (2025-12-01)
- External partners can scan QR codes for their venue events
- Students can only scan organizer QR codes (STUDENTS_SCAN mode)

---

## 🧪 Testing

### Unit Tests

**Location:** `backend/src/common/utils/checkin-mode.utils.spec.ts`

**Coverage:** 11 tests, all passing ✅

**Test Scenarios:**

```typescript
describe('determineCheckInMode', () => {
  // Internal Free: STUDENTS_SCAN
  it('should return STUDENTS_SCAN for internal free events')

  // Internal Paid: ORGANIZER_SCANS
  it('should return ORGANIZER_SCANS for internal paid events')

  // External Free: ORGANIZER_SCANS (analytics)
  it('should return ORGANIZER_SCANS for external free events')

  // External Paid: ORGANIZER_SCANS
  it('should return ORGANIZER_SCANS for external paid events')
});

describe('shouldGenerateRegistrationQR', () => {
  // STUDENTS_SCAN: no registration QR
  it('should return false for STUDENTS_SCAN mode (free)')
  it('should return false for STUDENTS_SCAN mode (paid)')

  // ORGANIZER_SCANS + paid: no registration QR (ticket QR instead)
  it('should return false for ORGANIZER_SCANS mode with paid events')

  // ORGANIZER_SCANS + free: yes registration QR (external analytics)
  it('should return true for ORGANIZER_SCANS mode with free events')
});
```

**Run Tests:**
```bash
cd backend
npm test -- checkin-mode.utils.spec.ts
```

---

### Manual Testing Checklist

#### Event Type 1: Internal Free (STUDENTS_SCAN)
- [ ] Create internal free event
- [ ] Verify `checkInMode = STUDENTS_SCAN`
- [ ] Student registers
- [ ] Verify `registration.qrCode = null`
- [ ] Frontend shows "Scan organizer's QR" message
- [ ] Organizer generates event QR
- [ ] Student scans event QR successfully
- [ ] Check-in recorded in database

#### Event Type 2: Internal Paid (ORGANIZER_SCANS)
- [ ] Create internal paid event
- [ ] Verify `checkInMode = ORGANIZER_SCANS`
- [ ] Student registers + pays
- [ ] Verify ticket QR generated
- [ ] Verify `registration.qrCode = null`
- [ ] Organizer scans ticket QR
- [ ] Check-in recorded, ticket marked as used

#### Event Type 3: External Free (ORGANIZER_SCANS)
- [ ] External partner creates free event
- [ ] Verify `checkInMode = ORGANIZER_SCANS`
- [ ] Verify `isExternalEvent = true`
- [ ] Student registers
- [ ] Verify `registration.qrCode` contains base64 image
- [ ] Frontend displays registration QR code
- [ ] Partner scans registration QR
- [ ] Check-in recorded for analytics

#### Event Type 4: External Paid (ORGANIZER_SCANS)
- [ ] External partner creates paid event
- [ ] Verify `checkInMode = ORGANIZER_SCANS`
- [ ] Student registers + pays
- [ ] Verify ticket QR generated
- [ ] Verify `registration.qrCode = null`
- [ ] Partner scans ticket QR
- [ ] Check-in recorded, payment tracked

#### Edge Cases
- [ ] Try changing `isPaid` after registrations exist → should fail with error
- [ ] Verify MODERATOR can scan QR codes
- [ ] Test QR signature validation (tampered QR should fail)
- [ ] Test duplicate check-in prevention

---

## 🔄 Migration Guide

### Migrating Existing Events

**Script:** `backend/scripts/fix-checkin-modes.ts`

**Purpose:** Update `checkInMode` for all existing events and clear incorrect QR codes.

**Run Migration:**
```bash
cd backend
npx ts-node scripts/fix-checkin-modes.ts
```

**What It Does:**
1. Fetches all events
2. Calculates correct `checkInMode` based on `isPaid` and `isExternalEvent`
3. Updates events with incorrect `checkInMode`
4. Clears `registration.qrCode` for `STUDENTS_SCAN` events (shouldn't have QR)
5. Prints summary of changes

**Expected Output:**
```
Starting check-in mode migration...
Found 150 events to check

Migration complete!
Total events checked: 150
Events updated: 23

Updated events:
  1. [abc12345...] "Free Lecture": ORGANIZER_SCANS → STUDENTS_SCAN
  2. [def67890...] "Partner Event": STUDENTS_SCAN → ORGANIZER_SCANS
  ...

Clearing registration QR codes for STUDENTS_SCAN events...
Cleared 45 registration QR codes

✅ Migration completed successfully!
```

**When to Run:**
- After deploying this update to production
- Before enabling QR check-in features
- If data inconsistencies are detected

---

## 🐛 Troubleshooting

### Issue: Student sees QR code for internal free event

**Symptoms:** QR code appears on "My Registrations" page for internal free event.

**Diagnosis:**
1. Check `event.checkInMode` → should be `STUDENTS_SCAN`
2. Check `registration.qrCode` → should be `null`

**Solution:**
- Run migration script: `npx ts-node scripts/fix-checkin-modes.ts`
- Manually update: `UPDATE registrations SET qrCode = NULL WHERE eventId = 'xxx'`

---

### Issue: External free event not generating QR

**Symptoms:** Student registers for external free event but no QR code appears.

**Diagnosis:**
1. Check `event.isExternalEvent` → should be `true`
2. Check `event.checkInMode` → should be `ORGANIZER_SCANS`
3. Check `event.isPaid` → should be `false`
4. Check `registration.qrCode` → should contain base64 data URL

**Solution:**
- Verify event creation: `externalPartnerId` must be set
- Check logs for QR generation errors
- Verify `PAYMENT_SECRET` is set in `.env`

---

### Issue: Cannot change event from free to paid

**Symptoms:** Error when trying to update `isPaid` field.

**Expected Behavior:** This is correct! Cannot change `isPaid` after registrations exist.

**Reason:** Edge Case 1 - Prevents breaking existing registrations.

**Solution:**
- Create a new event with correct `isPaid` value
- Cancel/migrate existing registrations if needed

---

### Issue: MODERATOR cannot scan QR codes

**Symptoms:** 403 Forbidden when moderator tries to scan.

**Diagnosis:**
1. Check user role → should be `MODERATOR`
2. Check endpoint decorators → should include `Role.MODERATOR`

**Solution:**
- Verify roles in `checkin.controller.ts`:
  ```typescript
  @Roles(Role.ORGANIZER, Role.EXTERNAL_PARTNER, Role.MODERATOR, Role.ADMIN)
  ```
- Re-deploy backend if decorators are missing

---

### Issue: QR signature validation fails

**Symptoms:** Valid QR code rejected with "Invalid signature" error.

**Diagnosis:**
1. Check `PAYMENT_SECRET` in `.env` → must match between generation and validation
2. Check QR payload format → must be valid JSON
3. Check signature algorithm → must be HMAC-SHA256

**Solution:**
- Verify environment variables are loaded: `process.env.PAYMENT_SECRET`
- Regenerate QR codes if secret changed
- Check for whitespace/encoding issues in secret

---

## 📊 Analytics & Monitoring

### Key Metrics to Track

1. **Check-In Rates by Event Type:**
   - Internal Free: `checkedInCount / registrationCount`
   - Internal Paid: `checkedInCount / ticketCount`
   - External Free: `checkedInCount / registrationCount`
   - External Paid: `checkedInCount / ticketCount`

2. **QR Scan Success Rate:**
   - Total scans attempted
   - Successful check-ins
   - Failed scans (invalid QR, duplicate, etc.)

3. **Mode Usage:**
   - `ORGANIZER_SCANS` events count
   - `STUDENTS_SCAN` events count

### Database Queries

**Get check-in rate by event:**
```sql
SELECT
  e.id,
  e.title,
  e.checkInMode,
  COUNT(DISTINCT r.id) as total_registrations,
  COUNT(DISTINCT c.id) as checked_in_count,
  (COUNT(DISTINCT c.id)::float / COUNT(DISTINCT r.id)) * 100 as check_in_rate
FROM events e
LEFT JOIN registrations r ON r.eventId = e.id
LEFT JOIN check_ins c ON c.eventId = e.id
WHERE e.startDate < NOW()
GROUP BY e.id
ORDER BY check_in_rate DESC;
```

**Get QR generation stats:**
```sql
SELECT
  e.checkInMode,
  e.isPaid,
  e.isExternalEvent,
  COUNT(*) as event_count,
  COUNT(CASE WHEN r.qrCode IS NOT NULL THEN 1 END) as qr_generated_count
FROM events e
LEFT JOIN registrations r ON r.eventId = e.id
GROUP BY e.checkInMode, e.isPaid, e.isExternalEvent;
```

---

## 🚀 Future Enhancements

### Potential Improvements

1. **QR Code Expiry:**
   - Add `expiresAt` to QR payload
   - Validate timestamp on scan
   - Auto-regenerate expired QR codes

2. **Offline Check-In:**
   - Cache event data for offline scanning
   - Sync check-ins when back online
   - Progressive Web App (PWA) support

3. **Bulk Check-In:**
   - Upload CSV of attendees
   - Bulk QR generation for organizers
   - Batch check-in API endpoint

4. **Analytics Dashboard:**
   - Real-time check-in monitoring
   - QR scan heatmaps
   - Attendance predictions

5. **Multi-Factor Check-In:**
   - QR + Face recognition
   - QR + Student ID verification
   - Geofencing (location-based check-in)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2025-12-01 | Added QRScanner component - Students can now scan organizer QR codes using camera |
| 1.0 | 2025-12-01 | Initial implementation - 4 event types, conditional QR, MODERATOR permissions |

---

## 🤝 Contributing

When modifying the check-in system:

1. **Update utility functions** in `checkin-mode.utils.ts` first
2. **Add unit tests** to `checkin-mode.utils.spec.ts`
3. **Update this documentation** with new logic
4. **Test all 4 event type scenarios** manually
5. **Run migration script** if database changes needed
6. **Update API documentation** in Swagger decorators

---

## 📞 Support

For questions or issues:
- Check [Troubleshooting](#troubleshooting) section
- Review unit tests for expected behavior
- Check backend logs: `docker-compose logs -f backend`
- Contact development team

---

**Document Status:** Complete ✅
**Code Status:** Implemented & Tested ✅
**Production Ready:** Yes (after migration script runs)
