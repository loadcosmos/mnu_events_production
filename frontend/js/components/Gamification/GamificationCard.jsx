import React, { useEffect, useState } from 'react';
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
            setError('Не удалось загрузить данные геймификации');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (!stats) return null;

    const levelConfig = gamificationService.getLevelConfig(stats.level);
    const recentAchievements = achievements.slice(0, 5);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header with gradient */}
            <div
                className="p-6 text-white"
                style={{
                    background: `linear-gradient(135deg, ${levelConfig.color} 0%, ${levelConfig.color}dd 100%)`,
                }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Ваш прогресс</h2>
                    <span className="text-5xl">{levelConfig.icon}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div>
                        <p className="text-sm opacity-90 mb-1">Текущий уровень</p>
                        <p className="text-3xl font-bold">{levelConfig.label}</p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-sm opacity-90 mb-1">Баллы</p>
                        <p className="text-3xl font-bold">{stats.points}</p>
                    </div>
                </div>
            </div>

            {/* Progress section */}
            <div className="p-6 bg-gray-50">
                <LevelProgressBar currentPoints={stats.points} currentLevel={stats.level} />
            </div>

            {/* Statistics */}
            <div className="p-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.eventsAttended || 0}</p>
                    <p className="text-sm text-gray-600">Событий посещено</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.clubsJoined || 0}</p>
                    <p className="text-sm text-gray-600">Клубов</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
                    <p className="text-sm text-gray-600">Достижений</p>
                </div>
            </div>

            {/* Recent achievements */}
            {recentAchievements.length > 0 && (
                <div className="p-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Последние достижения
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
                            className="mt-4 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Показать все достижения ({achievements.length})
                        </button>
                    )}
                </div>
            )}

            {/* No achievements yet */}
            {recentAchievements.length === 0 && (
                <div className="p-6 border-t border-gray-200 text-center">
                    <p className="text-gray-500">
                        У вас пока нет достижений. Посещайте мероприятия, чтобы получать баллы и награды!
                    </p>
                </div>
            )}
        </div>
    );
};

GamificationCard.propTypes = {
    userId: PropTypes.string,
};

export default GamificationCard;
