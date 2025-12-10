import React, { useEffect, useState, memo } from 'react';
import PropTypes from 'prop-types';
import GamificationBadge from './GamificationBadge';
import LevelProgressBar from './LevelProgressBar';
import AchievementItem from './AchievementItem';
import gamificationService from '../../services/gamificationService';

/**
 * GamificationCard Component
 * Main gamification display for profile page
 * Shows level, points, progress, achievements, and statistics
 */
const GamificationCard = ({ userId }) => {
    const [stats, setStats] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadGamificationData();
    }, [userId]);

    const loadGamificationData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [statsData, achievementsData] = await Promise.all([
                gamificationService.getUserStats(),
                gamificationService.getUserAchievements(),
            ]);

            setStats(statsData);
            setAchievements(achievementsData);
        } catch (err) {
            console.error('Error loading gamification data:', err);
            setError('Failed to load gamification data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-md p-6 border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-md p-6 border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (!stats) return null;

    const levelConfig = gamificationService.getLevelConfig(stats.level);
    const recentAchievements = achievements.slice(0, 5);

    return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
            {/* Header with gradient */}
            <div
                className="p-6 text-white"
                style={{
                    background: `linear-gradient(135deg, ${levelConfig.color} 0%, ${levelConfig.color}dd 100%)`,
                }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Your Progress</h2>
                    <span className="text-5xl">{levelConfig.icon}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div>
                        <p className="text-sm opacity-90 mb-1">Current Level</p>
                        <p className="text-3xl font-bold">{levelConfig.label}</p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-sm opacity-90 mb-1">Points</p>
                        <p className="text-3xl font-bold">{stats.points}</p>
                    </div>
                </div>
            </div>

            {/* Progress section */}
            <div className="p-6 bg-gray-50 dark:bg-[#0f0f0f] transition-colors duration-300">
                <LevelProgressBar currentPoints={stats.points} currentLevel={stats.level} />
            </div>

            {/* Statistics */}
            <div className="p-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.eventsAttended || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Events Attended</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.clubsJoined || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Clubs</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{achievements.length}</p>
                    <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Achievements</p>
                </div>
            </div>

            {/* Recent achievements */}
            {recentAchievements.length > 0 && (
                <div className="p-6 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                        Recent Achievements
                    </h3>
                    <div className="space-y-3">
                        {recentAchievements.map((achievement) => (
                            <AchievementItem
                                key={achievement.id}
                                achievement={achievement}
                                isUnlocked={true}
                            />
                        ))}
                    </div>

                    {achievements.length > 5 && (
                        <button
                            onClick={() => {/* TODO: Navigate to achievements page */ }}
                            className="mt-4 w-full text-center text-sm font-medium text-[#d62e1f] hover:text-[#ff4433] transition-colors"
                        >
                            Show all achievements ({achievements.length})
                        </button>
                    )}
                </div>
            )}

            {/* No achievements yet */}
            {recentAchievements.length === 0 && (
                <div className="p-6 border-t border-gray-200 dark:border-[#2a2a2a] text-center transition-colors duration-300">
                    <p className="text-gray-500 dark:text-[#a0a0a0] transition-colors duration-300">
                        You don't have any achievements yet. Attend events to earn points and rewards!
                    </p>
                </div>
            )}
        </div>
    );
};

GamificationCard.propTypes = {
    userId: PropTypes.string,
};

export default memo(GamificationCard);
