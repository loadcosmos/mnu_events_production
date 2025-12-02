import { api } from './apiClient';

/**
 * Gamification Service
 * Handles all gamification-related API calls
 */
const gamificationService = {
    /**
     * Get user gamification stats (points, level, progress)
     * @returns {Promise<Object>} User stats including points, level, nextLevel info
     */
    async getUserStats() {
        try {
            const response = await api.get('/gamification/stats');
            return response;
        } catch (error) {
            console.error('Error fetching gamification stats:', error);
            throw error;
        }
    },

    /**
     * Get user achievements
     * @returns {Promise<Array>} List of user achievements
     */
    async getUserAchievements() {
        try {
            const response = await api.get('/gamification/achievements');
            return response;
        } catch (error) {
            console.error('Error fetching achievements:', error);
            throw error;
        }
    },

    /**
     * Get level configuration
     * @param {string} level - Level name (NEWCOMER, ACTIVE, LEADER, LEGEND)
     * @returns {Object} Level configuration including color, label, thresholds
     */
    getLevelConfig(level) {
        const LEVEL_CONFIG = {
            NEWCOMER: {
                min: 0,
                max: 100,
                color: '#9ca3af', // gray
                bgColor: '#f3f4f6',
                label: 'Новичок',
                icon: '🌱',
            },
            ACTIVE: {
                min: 100,
                max: 500,
                color: '#3b82f6', // blue
                bgColor: '#dbeafe',
                label: 'Активист',
                icon: '🔥',
            },
            LEADER: {
                min: 500,
                max: 1000,
                color: '#a855f7', // purple
                bgColor: '#f3e8ff',
                label: 'Лидер',
                icon: '👑',
            },
            LEGEND: {
                min: 1000,
                max: Infinity,
                color: '#f59e0b', // gold
                bgColor: '#fef3c7',
                label: 'Легенда',
                icon: '⭐',
            },
        };

        return LEVEL_CONFIG[level] || LEVEL_CONFIG.NEWCOMER;
    },

    /**
     * Calculate progress to next level
     * @param {number} currentPoints - Current user points
     * @param {string} currentLevel - Current level
     * @returns {Object} Progress information (percentage, pointsToNext, nextLevel)
     */
    calculateProgress(currentPoints, currentLevel) {
        const currentConfig = this.getLevelConfig(currentLevel);

        // If already at max level (LEGEND)
        if (currentLevel === 'LEGEND') {
            return {
                percentage: 100,
                pointsToNext: 0,
                nextLevel: null,
                pointsInLevel: currentPoints - currentConfig.min,
            };
        }

        // Find next level
        const levels = ['NEWCOMER', 'ACTIVE', 'LEADER', 'LEGEND'];
        const currentIndex = levels.indexOf(currentLevel);
        const nextLevel = levels[currentIndex + 1];
        const nextConfig = this.getLevelConfig(nextLevel);

        // Calculate progress
        const pointsInLevel = currentPoints - currentConfig.min;
        const pointsNeeded = currentConfig.max - currentConfig.min;
        const percentage = Math.min((pointsInLevel / pointsNeeded) * 100, 100);

        return {
            percentage: Math.round(percentage),
            pointsToNext: currentConfig.max - currentPoints,
            nextLevel,
            pointsInLevel,
            pointsNeeded,
        };
    },

    /**
     * Get achievement icon based on type
     * @param {string} type - Achievement type
     * @returns {string} Icon emoji
     */
    getAchievementIcon(type) {
        const ACHIEVEMENT_ICONS = {
            ATTENDANCE: '🎯',
            CATEGORY: '🏆',
            REGULARITY: '🔄',
            SOCIAL: '👥',
        };

        return ACHIEVEMENT_ICONS[type] || '🎉';
    },

    /**
     * Format achievement date
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatAchievementDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Сегодня';
        if (diffDays === 1) return 'Вчера';
        if (diffDays < 7) return `${diffDays} дней назад`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} недель назад`;

        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }
};

export default gamificationService;
