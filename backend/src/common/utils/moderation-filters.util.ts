import { BadRequestException } from '@nestjs/common';

/**
 * Automatic moderation filters for services and events
 */

export interface ModerationResult {
  passed: boolean;
  reason?: string;
}

/**
 * Check minimum description length
 */
export function checkMinLength(
  description: string,
  minLength: number,
): ModerationResult {
  if (description.length < minLength) {
    return {
      passed: false,
      reason: `Description must be at least ${minLength} characters (current: ${description.length})`,
    };
  }
  return { passed: true };
}

/**
 * Check for excessive character repetition (e.g., "Помогууууууууу")
 */
export function checkCharacterRepetition(
  text: string,
  maxRepetitions: number = 5,
): ModerationResult {
  const regex = new RegExp(`(.)\\1{${maxRepetitions},}`, 'g');
  const matches = text.match(regex);

  if (matches && matches.length > 0) {
    return {
      passed: false,
      reason: `Excessive character repetition detected: "${matches[0].substring(0, 10)}..."`,
    };
  }
  return { passed: true };
}

/**
 * Check for spam (too many repeated words)
 */
export function checkSpam(
  text: string,
  maxRepetitionRate: number = 0.5,
): ModerationResult {
  const words = text.toLowerCase().split(/\s+/);
  const wordCount: { [key: string]: number } = {};

  // Count word occurrences
  words.forEach((word) => {
    if (word.length > 2) {
      // Ignore very short words
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  // Find most repeated word
  let maxCount = 0;
  let mostRepeatedWord = '';
  Object.entries(wordCount).forEach(([word, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostRepeatedWord = word;
    }
  });

  const repetitionRate = maxCount / words.length;

  if (repetitionRate > maxRepetitionRate) {
    return {
      passed: false,
      reason: `Spam detected: word "${mostRepeatedWord}" repeated ${maxCount} times (${Math.round(
        repetitionRate * 100,
      )}% of content)`,
    };
  }
  return { passed: true };
}

/**
 * Check if contact information is provided (WhatsApp/Telegram)
 */
export function checkContactInfo(description: string): ModerationResult {
  const hasWhatsApp = /whatsapp|вотсап|ватсап/i.test(description);
  const hasTelegram = /telegram|телеграм/i.test(description);
  const hasPhone = /\+?\d{10,}/i.test(description); // At least 10 digits

  if (!hasWhatsApp && !hasTelegram && !hasPhone) {
    return {
      passed: false,
      reason:
        'Please include contact information (WhatsApp, Telegram, or phone number)',
    };
  }
  return { passed: true };
}

/**
 * Validate service listing (for students)
 */
export function validateServiceListing(
  title: string,
  description: string,
): void {
  // 1. Minimum description length: 100 characters
  const lengthCheck = checkMinLength(description, 100);
  if (!lengthCheck.passed) {
    throw new BadRequestException(lengthCheck.reason);
  }

  // 2. Check character repetition
  const repetitionCheck = checkCharacterRepetition(description);
  if (!repetitionCheck.passed) {
    throw new BadRequestException(repetitionCheck.reason);
  }

  // 3. Check for spam
  const spamCheck = checkSpam(description);
  if (!spamCheck.passed) {
    throw new BadRequestException(spamCheck.reason);
  }

  // 4. Check contact information
  const contactCheck = checkContactInfo(description);
  if (!contactCheck.passed) {
    throw new BadRequestException(contactCheck.reason);
  }
}

/**
 * Validate event listing
 */
export function validateEventListing(
  title: string,
  description: string,
  isPaid: boolean,
  price?: number,
): void {
  // 1. Minimum description length: 50 characters
  const lengthCheck = checkMinLength(description, 50);
  if (!lengthCheck.passed) {
    throw new BadRequestException(lengthCheck.reason);
  }

  // 2. Check character repetition
  const repetitionCheck = checkCharacterRepetition(description);
  if (!repetitionCheck.passed) {
    throw new BadRequestException(repetitionCheck.reason);
  }

  // 3. Paid events must have price > 0
  if (isPaid && (!price || price <= 0)) {
    throw new BadRequestException(
      'Paid events must have a price greater than 0',
    );
  }
}
