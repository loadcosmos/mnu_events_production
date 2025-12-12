import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateFormatters';
import { getCsiIcon, getCsiColors } from '../../utils/categoryMappers';
import { SkeletonCard } from '../../components/ui/skeleton';
import { useTranslation } from 'react-i18next';

/**
 * EventCard - Reusable card for displaying event in horizontal scroll
 * Memoized for better INP performance
 */
const EventCard = memo(function EventCard({ event, onClick }) {
    return (
        <div
            className="w-80 bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer group shadow-lg hover:shadow-2xl"
            onClick={() => onClick(event.id)}
        >
            {/* Image with Gradient - explicit dimensions for CLS prevention */}
            <div className="relative h-48">
                <img
                    src={event.imageUrl || '/images/event-placeholder.jpg'}
                    alt={event.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    width="320"
                    height="192"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = '/images/event-placeholder.jpg';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content */}
            <div className="p-4 md:p-5 lg:p-6 space-y-3 overflow-hidden">
                {/* Category and CSI Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block bg-[#d62e1f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md">
                        {t(`categories.${event.category}`)}
                    </span>
                    {/* CSI Tags */}
                    {event.csiTags && event.csiTags.length > 0 && (
                        event.csiTags.map((csiTag) => {
                            const colors = getCsiColors(csiTag);
                            return (
                                <span
                                    key={csiTag}
                                    className={`inline-flex items-center gap-1 ${colors.bg} ${colors.text} ${colors.border} px-2.5 py-1 rounded-lg text-xs font-semibold border`}
                                >
                                    {getCsiIcon(csiTag)}
                                </span>
                            );
                        })
                    )}
                </div>

                {/* Date/Time */}
                <div className="flex items-center gap-2">
                    <i className="fa-regular fa-calendar text-sm text-[#d62e1f]" />
                    <span className="text-sm md:text-base font-bold text-[#d62e1f]">{formatDate(event.startDate)}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#d62e1f] transition-colors leading-tight">
                    {event.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-[#a0a0a0] text-sm line-clamp-2 leading-relaxed transition-colors duration-300">
                    {event.description}
                </p>

                {/* Meta Info */}
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                        <i className="fa-solid fa-location-dot text-base text-[#d62e1f] flex-shrink-0" />
                        <span className="text-sm font-medium line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                        <i className="fa-solid fa-users text-base text-[#d62e1f] flex-shrink-0" />
                        <span className="text-sm font-semibold">
                            {event._count?.registrations || 0} / {event.capacity}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

/**
 * EventsHorizontalScroll - Horizontal scrolling events section
 * Reusable for "My Upcoming Events", "Trending", "Recommended" etc.
 */
export default function EventsHorizontalScroll({
    title,
    titleHighlight,
    subtitle,
    events,
    loading,
    error,
    onEventClick,
    viewAllLink = '/events',
    emptyMessage = 'No events available',
    emptyDescription = 'Check back later for new events!',
}) {
    const { t } = useTranslation();
    return (
        <section className="py-16 px-4 bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                            {title} <span className="text-[#d62e1f]">{titleHighlight}</span>
                        </h2>
                        <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                            {subtitle}
                        </p>
                    </div>
                    <Link
                        to={viewAllLink}
                        className="hidden md:flex items-center gap-2 text-[#d62e1f] font-semibold hover:text-[#ff4433] transition-colors"
                    >
                        {t('common.viewAll')}
                        <i className="fa-solid fa-arrow-right" />
                    </Link>
                </div>

                {/* Loading State - Skeleton Cards */}
                {loading ? (
                    <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                        <div className="flex gap-6 min-w-max">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="w-80">
                                    <SkeletonCard />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                        <i className="fa-solid fa-exclamation-circle text-4xl text-[#d62e1f] mb-4"></i>
                        <p className="text-gray-900 dark:text-white font-semibold mb-2 transition-colors duration-300">
                            {t('events.failedToLoad')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                            {error}
                        </p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                        <i className="fa-regular fa-calendar-xmark text-4xl text-gray-400 dark:text-[#666666] mb-4 transition-colors duration-300"></i>
                        <p className="text-gray-900 dark:text-white font-semibold mb-2 transition-colors duration-300">
                            {emptyMessage}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                            {emptyDescription}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Horizontal Scroll Container */}
                        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                            <div className="flex gap-6 min-w-max">
                                {events.map((event) => (
                                    <EventCard key={event.id} event={event} onClick={onEventClick} />
                                ))}
                            </div>
                        </div>

                        {/* Mobile View All Link */}
                        <div className="md:hidden mt-6 text-center">
                            <Link
                                to={viewAllLink}
                                className="inline-flex items-center gap-2 text-[#d62e1f] font-semibold px-6 py-3 rounded-lg border-2 border-[#d62e1f] hover:bg-[#d62e1f] hover:text-white transition-all"
                            >
                                {t('home.viewAllEvents')}
                                <i className="fa-solid fa-arrow-right" />
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
