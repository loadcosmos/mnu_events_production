/**
 * Application-wide constants
 * Centralized configuration to avoid hardcoded values throughout the codebase
 */

// User roles
export const ROLES = {
  STUDENT: 'STUDENT',
  ORGANIZER: 'ORGANIZER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
};

// Event categories
export const EVENT_CATEGORIES = {
  ACADEMIC: 'ACADEMIC',
  SPORTS: 'SPORTS',
  CULTURAL: 'CULTURAL',
  TECH: 'TECH',
  SOCIAL: 'SOCIAL',
  CAREER: 'CAREER',
  OTHER: 'OTHER',
};

// CSI Categories (Creativity, Service, Intelligence)
export const CSI_CATEGORIES = {
  CREATIVITY: 'CREATIVITY',
  SERVICE: 'SERVICE',
  INTELLIGENCE: 'INTELLIGENCE',
};

// CSI Display Names
export const CSI_LABELS = {
  CREATIVITY: 'Creativity',
  SERVICE: 'Service',
  INTELLIGENCE: 'Intelligence',
};

// CSI Icons (emojis)
export const CSI_ICONS = {
  CREATIVITY: '🎨',
  SERVICE: '🤝',
  INTELLIGENCE: '🧠',
};

// CSI Colors (for badges and UI)
export const CSI_COLORS = {
  CREATIVITY: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    gradient: 'from-purple-500 to-pink-500',
  },
  SERVICE: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    gradient: 'from-green-500 to-emerald-500',
  },
  INTELLIGENCE: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    gradient: 'from-blue-500 to-cyan-500',
  },
};

// Event statuses
export const EVENT_STATUSES = {
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Registration statuses
export const REGISTRATION_STATUSES = {
  REGISTERED: 'REGISTERED',
  WAITLIST: 'WAITLIST',
  CANCELLED: 'CANCELLED',
};

// Club categories
export const CLUB_CATEGORIES = {
  ACADEMIC: 'ACADEMIC',
  ARTS: 'ARTS',
  SERVICE: 'SERVICE',
  TECH: 'TECH',
  SPORTS: 'SPORTS',
  CULTURAL: 'CULTURAL',
  OTHER: 'OTHER',
};

// Asset paths
export const ASSETS = {
  LOGO: '/images/logo.png',
  BACKGROUND: '/images/backg.jpg',
  EVENT_PLACEHOLDER: '/images/event-placeholder.jpg',
};

// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000, // 10 seconds
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_EVENT_LIMIT: 50,
  MAX_LIMIT: 100,
};

// Time constants
export const TIME = {
  DEBOUNCE_DELAY: 500, // milliseconds
  SLIDER_INTERVAL: 5000, // milliseconds
  TOAST_DURATION: 3000, // milliseconds
};

// Language options
export const LANGUAGES = {
  EN: 'en',
  RU: 'ru',
  KK: 'kk',
};

// Brand colors - Dark Theme
export const COLORS = {
  PRIMARY: '#d62e1f', // MNU Red
  PRIMARY_DARK: '#b91c1c',
  PRIMARY_LIGHT: '#ff4433',

  // Dark theme backgrounds
  BG_DARK: '#0a0a0a', // Very dark background
  BG_CARD: '#1a1a1a', // Card background
  BG_HOVER: '#252525', // Hover state

  // Text colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#a0a0a0',
  TEXT_MUTED: '#666666',

  // Border
  BORDER: '#2a2a2a',
};
