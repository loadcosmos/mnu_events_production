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
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    Progress to next level
                </span>
                {progress.nextLevel ? (
                    <span className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                        {progress.pointsToNext} points to {gamificationService.getLevelConfig(progress.nextLevel).label}
                    </span>
                ) : (
                    <span className="text-sm font-semibold" style={{ color: currentConfig.color }}>
                        Max level!
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-3 overflow-hidden transition-colors duration-300">
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
                <span className="text-xs text-gray-500 dark:text-[#666666] transition-colors duration-300">
                    {progress.pointsInLevel} / {progress.pointsNeeded || currentPoints} points
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
