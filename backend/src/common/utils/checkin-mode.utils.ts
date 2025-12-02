import { CheckInMode } from '@prisma/client';

export interface EventCheckInData {
  isPaid: boolean;
  isExternalEvent: boolean;
}

/**
 * Determines check-in mode based on event type
 *
 * Business rules:
 * 1. External events ALWAYS use ORGANIZER_SCANS (for analytics)
 * 2. Internal paid events use ORGANIZER_SCANS (student has ticket)
 * 3. Internal free events use STUDENTS_SCAN (organizer displays QR)
 *
 * @param event - Event data with isPaid and isExternalEvent flags
 * @returns CheckInMode enum value
 */
export function determineCheckInMode(event: EventCheckInData): CheckInMode {
  // External venues always scan students for analytics
  if (event.isExternalEvent) {
    return CheckInMode.ORGANIZER_SCANS;
  }

  // Internal paid events: organizer scans student's ticket
  if (event.isPaid) {
    return CheckInMode.ORGANIZER_SCANS;
  }

  // Internal free events: student scans organizer's QR
  return CheckInMode.STUDENTS_SCAN;
}

/**
 * Determines if a registration should receive a QR code
 *
 * Rules:
 * - ORGANIZER_SCANS + FREE EVENT + EXTERNAL = YES (for analytics)
 * - ORGANIZER_SCANS + PAID EVENT = NO (ticket has QR)
 * - STUDENTS_SCAN = NO (event has QR)
 *
 * @param checkInMode - The check-in mode of the event
 * @param isPaid - Whether the event is paid
 * @returns true if registration should have QR code
 */
export function shouldGenerateRegistrationQR(
  checkInMode: CheckInMode,
  isPaid: boolean
): boolean {
  // Student scans event QR, not registration QR
  if (checkInMode === CheckInMode.STUDENTS_SCAN) {
    return false;
  }

  if (checkInMode === CheckInMode.ORGANIZER_SCANS) {
    if (isPaid) {
      // Paid events: ticket has QR
      return false;
    } else {
      // Free external events: registration gets QR for analytics
      return true;
    }
  }

  return false;
}
