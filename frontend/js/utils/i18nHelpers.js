/**
 * Centralized i18n Helper Functions
 *
 * These functions provide a single source of truth for translating enum values.
 * All functions accept the `t` function from useTranslation() hook.
 *
 * Usage:
 * import { useTranslation } from 'react-i18next';
 * import { getTranslatedCategory } from '@/utils/i18nHelpers';
 *
 * const { t } = useTranslation();
 * const label = getTranslatedCategory(t, 'ACADEMIC'); // Returns translated "Academic"
 */

// ==================== Event Categories ====================
// ACADEMIC, SPORTS, CULTURAL, TECH, SOCIAL, CAREER, OTHER

export const getTranslatedCategory = (t, category) => {
  if (!category) return '';
  return t(`enums.category.${category}`, category);
};

// ==================== CSI Categories ====================
// CREATIVITY, SERVICE, INTELLIGENCE

export const getTranslatedCsiCategory = (t, csiCategory) => {
  if (!csiCategory) return '';
  return t(`enums.csiCategory.${csiCategory}`, csiCategory);
};

// ==================== User Roles ====================
// STUDENT, ORGANIZER, MODERATOR, ADMIN, EXTERNAL_PARTNER, FACULTY

export const getTranslatedRole = (t, role) => {
  if (!role) return '';
  return t(`enums.role.${role}`, role);
};

// ==================== Event Statuses ====================
// PENDING_MODERATION, UPCOMING, ONGOING, COMPLETED, CANCELLED

export const getTranslatedEventStatus = (t, status) => {
  if (!status) return '';
  return t(`enums.eventStatus.${status}`, status);
};

// ==================== Registration Statuses ====================
// REGISTERED, WAITLIST, CANCELLED, CHECKED_IN

export const getTranslatedRegistrationStatus = (t, status) => {
  if (!status) return '';
  return t(`enums.registrationStatus.${status}`, status);
};

// ==================== Ticket Statuses ====================
// VALID, USED, EXPIRED, CANCELLED

export const getTranslatedTicketStatus = (t, status) => {
  if (!status) return '';
  return t(`enums.ticketStatus.${status}`, status);
};

// ==================== Service Types ====================
// OFFERING, SEEKING

export const getTranslatedServiceType = (t, type) => {
  if (!type) return '';
  return t(`enums.serviceType.${type}`, type);
};

// ==================== Service Categories ====================
// DESIGN, PHOTO_VIDEO, IT, COPYWRITING, CONSULTING, etc.

export const getTranslatedServiceCategory = (t, category) => {
  if (!category) return '';
  return t(`enums.serviceCategory.${category}`, category);
};

// ==================== Payment Statuses ====================
// PENDING, PAID, EXPIRED

export const getTranslatedPaymentStatus = (t, status) => {
  if (!status) return '';
  return t(`enums.paymentStatus.${status}`, status);
};

// ==================== User Levels (Gamification) ====================
// NEWCOMER, ACTIVE, LEADER, LEGEND

export const getTranslatedUserLevel = (t, level) => {
  if (!level) return '';
  return t(`enums.userLevel.${level}`, level);
};

// ==================== Post Types ====================
// ANNOUNCEMENT, FACULTY_POST, STUDENT_POST

export const getTranslatedPostType = (t, type) => {
  if (!type) return '';
  return t(`enums.postType.${type}`, type);
};

// ==================== Filter Values ====================
// ALL, UPCOMING, PAST, WAITLIST, etc.

export const getTranslatedFilter = (t, filter) => {
  if (!filter) return '';
  return t(`common.filters.${filter.toLowerCase()}`, filter);
};

// ==================== Days of Week ====================
// MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY

export const getTranslatedDay = (t, day) => {
  if (!day) return '';
  return t(`enums.day.${day}`, day);
};

// Short day format (Mon, Tue, etc.)
export const getTranslatedDayShort = (t, day) => {
  if (!day) return '';
  return t(`enums.dayShort.${day}`, day.substring(0, 3));
};

// ==================== Time Slots ====================
// MORNING, AFTERNOON, EVENING

export const getTranslatedTimeSlot = (t, slot) => {
  if (!slot) return '';
  return t(`enums.timeSlot.${slot}`, slot);
};

// Time slot with time range description
export const getTranslatedTimeSlotWithRange = (t, slot) => {
  if (!slot) return { label: '', sublabel: '' };
  return {
    label: t(`enums.timeSlot.${slot}`, slot),
    sublabel: t(`enums.timeSlotRange.${slot}`, '')
  };
};

// ==================== Price Types ====================
// FREE, PAID

export const getTranslatedPriceType = (t, type) => {
  if (!type) return '';
  return t(`enums.priceType.${type}`, type);
};
