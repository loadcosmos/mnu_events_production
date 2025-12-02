import React from 'react';
import PropTypes from 'prop-types';
import gamificationService from '../../services/gamificationService';

/**
 * AchievementItem Component
 * Displays a single achievement with icon, name, description, points, and date
 */
const AchievementItem = ({ achievement, isUnlocked = true }) => {
    const icon = gamificationService.getAchievementIcon(achievement.type);
    const formattedDate = achievement.unlockedAt
        ? gamificationService.formatAchievementDate(achievement.unlockedAt)
        : null;

    return (
        <div
            className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${isUnlocked
                    ? 'bg-white border-gray-200 hover:shadow-md'
                    : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
        >
            {/* Icon */}
            <div
                className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-2xl ${isUnlocked ? 'bg-gradient-to-br from-yellow-100 to-orange-100' : 'bg-gray-200'
                    }`}
            >
                {isUnlocked ? icon : '🔒'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {achievement.name}
                    </h4>
                    {isUnlocked && (
                        <span className="flex-shrink-0 text-sm font-semibold text-amber-600">
                            +{achievement.points} баллов
                        </span>
                    )}
                </div>

                <p className={`text-sm mt-1 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                    {achievement.description}
                </p>

                {isUnlocked && formattedDate && (
                    <p className="text-xs text-gray-400 mt-2">
                        Получено: {formattedDate}
                    </p>
                )}

                {!isUnlocked && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                        Еще не получено
                    </p>
                )}
            </div>
        </div>
    );
};

AchievementItem.propTypes = {
    achievement: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        points: PropTypes.number.isRequired,
        type: PropTypes.oneOf(['ATTENDANCE', 'CATEGORY', 'REGULARITY', 'SOCIAL']).isRequired,
        unlockedAt: PropTypes.string,
    }).isRequired,
    isUnlocked: PropTypes.bool,
};

export default AchievementItem;
