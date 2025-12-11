/**
 * Shared Preferences Constants
 * Used by OnboardingModal and EditInterestsSection to ensure consistency
 */

// Event Categories (matching backend Category enum)
export const EVENT_CATEGORIES = [
    'ACADEMIC',
    'SPORTS',
    'CULTURAL',
    'TECH',
    'SOCIAL',
    'CAREER',
    'OTHER'
];

// CSI Categories (matching backend CsiCategory enum)
// CSI = Creativity, Service, Intelligence
export const CSI_TAGS = [
    'CREATIVITY',
    'SERVICE',
    'INTELLIGENCE'
];

// Days of Week (matching backend AvailableDay enum)
export const DAYS_OF_WEEK = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
];

// Time Slots (matching backend TimeSlot enum)
export const TIME_SLOTS = {
    MORNING: 'MORNING',
    AFTERNOON: 'AFTERNOON',
    EVENING: 'EVENING'
};

// Formatting functions for display
export const formatCategory = (category) => {
    const categoryNames = {
        'ACADEMIC': '📚 Academic',
        'SPORTS': '⚽ Sports',
        'CULTURAL': '🎭 Cultural',
        'TECH': '💻 Tech',
        'SOCIAL': '🎉 Social',
        'CAREER': '💼 Career',
        'OTHER': '✨ Other'
    };
    return categoryNames[category] || category.charAt(0) + category.slice(1).toLowerCase();
};

export const formatCsiTag = (tag) => {
    const tagNames = {
        'CREATIVITY': '🎨 Creativity',
        'SERVICE': '🤝 Service',
        'INTELLIGENCE': '🧠 Intelligence'
    };
    return tagNames[tag] || tag.charAt(0) + tag.slice(1).toLowerCase();
};

export const formatDay = (day) => {
    const dayNames = {
        'MONDAY': 'Mon',
        'TUESDAY': 'Tue',
        'WEDNESDAY': 'Wed',
        'THURSDAY': 'Thu',
        'FRIDAY': 'Fri',
        'SATURDAY': 'Sat',
        'SUNDAY': 'Sun'
    };
    return dayNames[day] || day;
};

export const formatTimeSlot = (slot) => {
    const slotNames = {
        'MORNING': { label: '🌅 Morning', sublabel: '8am - 12pm' },
        'AFTERNOON': { label: '☀️ Afternoon', sublabel: '12pm - 5pm' },
        'EVENING': { label: '🌙 Evening', sublabel: '5pm - 10pm' }
    };
    return slotNames[slot] || { label: slot, sublabel: '' };
};
