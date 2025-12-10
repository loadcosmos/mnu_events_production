import React, { memo } from 'react';
import { Link } from 'react-router-dom';

/**
 * SavedEventCard - Ultra-compact single-line layout
 * Shows thumbnail + title + date + unsave button in one row
 * Space savings: 60-70% compared to full EventCard
 */
function SavedEventCard({ event, onToggleSave, onClick }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    return (
        <div className="group flex items-center gap-3 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] dark:hover:border-[#d62e1f] transition-all">
            {/* Thumbnail */}
            <Link
                to={`/events/${event.id}`}
                onClick={(e) => {
                    if (onClick) {
                        e.preventDefault();
                        onClick();
                    }
                }}
                className="flex-shrink-0"
            >
                <img
                    src={event.imageUrl || '/placeholder-event.jpg'}
                    alt={event.title}
                    className="w-16 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform"
                    loading="lazy"
                />
            </Link>

            {/* Content - Single Line */}
            <Link
                to={`/events/${event.id}`}
                onClick={(e) => {
                    if (onClick) {
                        e.preventDefault();
                        onClick();
                    }
                }}
                className="flex-1 min-w-0"
            >
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {event.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(event.startDate)}
                    </span>
                </div>
            </Link>


            {/* Unsave Button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onToggleSave) onToggleSave();
                }}

                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#d62e1f] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                title="Remove from saved"
            >
                <i className="fa-solid fa-bookmark"></i>
            </button>
        </div>
    );
}

export default memo(SavedEventCard);
