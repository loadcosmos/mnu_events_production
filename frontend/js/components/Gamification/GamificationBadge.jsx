import React from 'react';
import { useTranslation } from 'react-i18next';
import gamificationService from '../../services/gamificationService';

/**
 * GamificationBadge Component
 * Displays user level badge with icon and points
 * Used in Header and other places
 */
const GamificationBadge = ({ level, points, size = 'medium', showPoints = true }) => {
    const { t } = useTranslation();
    const config = gamificationService.getLevelConfig(level);

    const sizeClasses = {
        small: 'text-xs px-2 py-1',
        medium: 'text-sm px-3 py-1.5',
        large: 'text-base px-4 py-2',
    };

    const iconSizes = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
    };

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full font-medium transition-all ${sizeClasses[size]}`}
            style={{
                backgroundColor: config.bgColor,
                color: config.color,
            }}
        >
            <span className={iconSizes[size]}>{config.icon}</span>
            <span className="font-semibold">{t(`enums.userLevel.${level}`)}</span>
            {showPoints && (
                <span className="ml-1 opacity-80">
                    {points} {t('gamification.points', { count: points })}
                </span>
            )}
        </div>
    );
};

export default GamificationBadge;
