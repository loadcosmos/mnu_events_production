/**
 * EventCard - Memoized event card component for performance
 * Used in EventsPage grid - optimized for smooth scrolling
 */

import React, { memo, useCallback } from 'react';
import { formatDate } from '../utils/dateFormatters';
import { getCsiIcon, getCsiColors } from '../utils/categoryMappers';
import { sanitizeText } from '../utils/sanitize';

const EventCard = memo(function EventCard({ event, onClick, isSaved, onToggleSave }) {
    const imageUrl = event.imageUrl || '/images/backg.jpg';

    const handleClick = useCallback(() => {
        if (onClick) onClick(event.id);
    }, [onClick, event.id]);


    const handleImageError = useCallback((e) => {
        e.target.src = '/images/event-placeholder.jpg';
    }, []);

    return (
        <div
            className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] cursor-pointer group shadow-lg flex flex-col transition-[border-color] duration-200"
            onClick={handleClick}
        >
            {/* Image Section - No hover animations for performance */}
            <div className="relative h-48 md:h-52 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-[#0a0a0a]">
                <img
                    src={imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    width="400"
                    height="208"
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                {/* Bookmark Button - Top Right */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleSave) onToggleSave(event.id);
                    }}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-all transform hover:scale-105 active:scale-95"
                    aria-label={isSaved ? "Unsave event" : "Save event"}
                >
                    <i className={`${isSaved ? 'fa-solid text-[#d62e1f]' : 'fa-regular'} fa-bookmark text-lg drop-shadow-md`} />
                </button>
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col px-5 py-5 md:px-6 md:py-6 space-y-4">
                {/* Category Badge and CSI Tags */}
                <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
                    <span className="inline-block bg-[#d62e1f] text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide">
                        {event.category}
                    </span>
                    {/* CSI Tags - limited to 3 for performance */}
                    {event.csiTags?.slice(0, 3).map((csiTag) => {
                        const colors = getCsiColors(csiTag);
                        return (
                            <span
                                key={csiTag}
                                className={`inline-flex items-center gap-1 ${colors.bg} ${colors.text} ${colors.border} px-2.5 py-1 rounded-lg text-xs font-semibold border`}
                            >
                                {getCsiIcon(csiTag)}
                            </span>
                        );
                    })}
                </div>

                {/* Date/Time */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                    <i className="fa-regular fa-calendar text-[#d62e1f] text-base" />
                    <span className="text-base font-bold text-[#d62e1f]">{formatDate(event.startDate)}</span>
                </div>

                {/* Event Title */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight flex-shrink-0">
                    {event.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-[#a0a0a0] text-sm leading-relaxed line-clamp-2 flex-shrink-0">
                    {sanitizeText(event.description)}
                </p>

                {/* Meta Info */}
                <div className="flex flex-col gap-2.5 pt-4 border-t border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
                    {/* Location */}
                    <div className="flex items-center gap-2.5">
                        <i className="fa-solid fa-location-dot text-[#d62e1f] text-base flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-600 dark:text-[#a0a0a0] truncate">{event.location}</span>
                    </div>
                    {/* Capacity */}
                    <div className="flex items-center gap-2.5">
                        <i className="fa-solid fa-users text-[#d62e1f] text-base flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-600 dark:text-[#a0a0a0]">
                            {event._count?.registrations || 0} / {event.capacity}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default EventCard;
