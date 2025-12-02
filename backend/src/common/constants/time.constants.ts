/**
 * Time-related constants for consistent timing across the application
 */

export const TIME_CONSTANTS = {
  /** Verification code expiry time (24 hours in milliseconds) */
  VERIFICATION_CODE_EXPIRY_MS: 24 * 60 * 60 * 1000,
  /** Resend verification code cooldown (5 minutes in milliseconds) */
  RESEND_COOLDOWN_MS: 5 * 60 * 1000,
  /** JWT access token expiry (1 hour) */
  ACCESS_TOKEN_EXPIRY: '1h',
  /** JWT refresh token expiry (7 days) */
  REFRESH_TOKEN_EXPIRY: '7d',
} as const;
