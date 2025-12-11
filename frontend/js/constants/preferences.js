/**
 * Shared Preferences Constants
 * Used by OnboardingModal and EditInterestsSection to ensure consistency
 */

// Event Categories (matching backend EventCategory enum)
export const EVENT_CATEGORIES = [
    'ACADEMIC',
    'SPORTS',
    'CULTURAL',
    'SOCIAL',
    'CAREER',
    'VOLUNTEER',
    'WORKSHOP',
    'CONCERT',
    'EXHIBITION',
    'COMPETITION',
    'CONFERENCE',
    'OTHER'
];

// CSI Tags (matching backend csiTags field)
export const CSI_TAGS = [
    'universiade',
    'culture',
    'sport',
    'social',
    'professional',
    'leadership',
    'community',
    'innovation',
    'research',
    'creative'
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
        'SOCIAL': '🎉 Social',
        'CAREER': '💼 Career',
        'VOLUNTEER': '🤝 Volunteer',
        'WORKSHOP': '🛠️ Workshop',
        'CONCERT': '🎵 Concert',
        'EXHIBITION': '🖼️ Exhibition',
        'COMPETITION': '🏆 Competition',
        'CONFERENCE': '🎤 Conference',
        'OTHER': '✨ Other'
    };
    return categoryNames[category] || category.charAt(0) + category.slice(1).toLowerCase();
};

export const formatCsiTag = (tag) => {
    const tagNames = {
        'universiade': '🏅 Universiade',
        'culture': '🎭 Culture',
        'sport': '⚽ Sport',
        'social': '🎉 Social',
        'professional': '💼 Professional',
        'leadership': '👑 Leadership',
        'community': '🤝 Community',
        'innovation': '💡 Innovation',
        'research': '🔬 Research',
        'creative': '🎨 Creative'
    };
    return tagNames[tag] || `#${tag}`;
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
