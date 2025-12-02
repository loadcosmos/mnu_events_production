import React from 'react';
import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Stat Card Component
 * Displays a statistic with icon and optional trend
 */
export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp = true,
  className = ''
}) {
  return (
    <Card className={`liquid-glass-card rounded-2xl hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-[#a0a0a0] mb-1">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {value}
            </h3>
            {trend && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {trendUp ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{trend}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Icon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
