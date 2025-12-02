import {
  determineCheckInMode,
  shouldGenerateRegistrationQR,
} from './checkin-mode.utils';
import { CheckInMode } from '@prisma/client';

describe('CheckInMode Utils', () => {
  describe('determineCheckInMode', () => {
    it('should return STUDENTS_SCAN for internal free events', () => {
      const result = determineCheckInMode({
        isPaid: false,
        isExternalEvent: false,
      });
      expect(result).toBe(CheckInMode.STUDENTS_SCAN);
    });

    it('should return ORGANIZER_SCANS for internal paid events', () => {
      const result = determineCheckInMode({
        isPaid: true,
        isExternalEvent: false,
      });
      expect(result).toBe(CheckInMode.ORGANIZER_SCANS);
    });

    it('should return ORGANIZER_SCANS for external free events (analytics)', () => {
      const result = determineCheckInMode({
        isPaid: false,
        isExternalEvent: true,
      });
      expect(result).toBe(CheckInMode.ORGANIZER_SCANS);
    });

    it('should return ORGANIZER_SCANS for external paid events', () => {
      const result = determineCheckInMode({
        isPaid: true,
        isExternalEvent: true,
      });
      expect(result).toBe(CheckInMode.ORGANIZER_SCANS);
    });
  });

  describe('shouldGenerateRegistrationQR', () => {
    it('should return false for STUDENTS_SCAN mode (internal free)', () => {
      const result = shouldGenerateRegistrationQR(
        CheckInMode.STUDENTS_SCAN,
        false
      );
      expect(result).toBe(false);
    });

    it('should return false for ORGANIZER_SCANS + paid (ticket has QR)', () => {
      const result = shouldGenerateRegistrationQR(
        CheckInMode.ORGANIZER_SCANS,
        true
      );
      expect(result).toBe(false);
    });

    it('should return true for ORGANIZER_SCANS + free (external analytics)', () => {
      const result = shouldGenerateRegistrationQR(
        CheckInMode.ORGANIZER_SCANS,
        false
      );
      expect(result).toBe(true);
    });
  });

  describe('Business Logic Matrix', () => {
    const testCases = [
      {
        name: 'Internal Free Event',
        isPaid: false,
        isExternalEvent: false,
        expectedMode: CheckInMode.STUDENTS_SCAN,
        shouldHaveRegistrationQR: false,
      },
      {
        name: 'Internal Paid Event',
        isPaid: true,
        isExternalEvent: false,
        expectedMode: CheckInMode.ORGANIZER_SCANS,
        shouldHaveRegistrationQR: false,
      },
      {
        name: 'External Free Event',
        isPaid: false,
        isExternalEvent: true,
        expectedMode: CheckInMode.ORGANIZER_SCANS,
        shouldHaveRegistrationQR: true,
      },
      {
        name: 'External Paid Event',
        isPaid: true,
        isExternalEvent: true,
        expectedMode: CheckInMode.ORGANIZER_SCANS,
        shouldHaveRegistrationQR: false,
      },
    ];

    testCases.forEach((testCase) => {
      it(`${testCase.name}: should have correct checkInMode and registration QR logic`, () => {
        const checkInMode = determineCheckInMode({
          isPaid: testCase.isPaid,
          isExternalEvent: testCase.isExternalEvent,
        });

        expect(checkInMode).toBe(testCase.expectedMode);

        const hasRegistrationQR = shouldGenerateRegistrationQR(
          checkInMode,
          testCase.isPaid
        );

        expect(hasRegistrationQR).toBe(testCase.shouldHaveRegistrationQR);
      });
    });
  });
});
