import React from 'react';
import PropTypes from 'prop-types';
import gamificationService from '../../services/gamificationService';

/**
 * LevelProgressBar Component
 * Shows visual progress bar to next level
 */
const LevelProgressBar = ({ currentPoints, currentLevel }) => {
    const progress = gamificationService.calculateProgress(currentPoints, currentLevel);
    const currentConfig = gamificationService.getLevelConfig(currentLevel);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                    Прогресс до следующего уровня
                </span>
                {progress.nextLevel ? (
                    <span className="text-sm text-gray-600">
                        {progress.pointsToNext} баллов до {gamificationService.getLevelConfig(progress.nextLevel).label}
                    </span>
                ) : (
                    <span className="text-sm font-semibold" style={{ color: currentConfig.color }}>
                        Максимальный уровень!
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${progress.percentage}%`,
                        backgroundColor: currentConfig.color,
                    }}
                />
            </div>

            {/* Points info */}
            <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                    {progress.pointsInLevel} / {progress.pointsNeeded || currentPoints} баллов
                </span>
                <span className="text-xs font-medium" style={{ color: currentConfig.color }}>
                    {progress.percentage}%
                </span>
            </div>
        </div>
    );
};

LevelProgressBar.propTypes = {
    currentPoints: PropTypes.number.isRequired,
    currentLevel: PropTypes.oneOf(['NEWCOMER', 'ACTIVE', 'LEADER', 'LEGEND']).isRequired,
};

export default LevelProgressBar;
