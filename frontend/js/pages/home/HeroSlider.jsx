import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { formatDate } from '../../utils/dateFormatters';
import { useTranslation } from 'react-i18next';

/**
 * HeroSlider - Full-screen event carousel for homepage
 * Displays trending events with auto-advance
 */
export default function HeroSlider({
    events,
    loading,
    currentSlide,
    setCurrentSlide,
    onEventClick,
}) {
    const { t } = useTranslation();
    // Preload first event image for LCP improvement
    useEffect(() => {
        if (events.length > 0 && events[0].imageUrl) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = events[0].imageUrl;
            link.fetchpriority = 'high';
            document.head.appendChild(link);
            return () => {
                if (document.head.contains(link)) {
                    document.head.removeChild(link);
                }
            };
        }
    }, [events]);

    if (loading) {
        return (
            <section className="relative h-screen -mt-20 pt-20 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0a0a0a] transition-colors duration-300">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-900 dark:text-white">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#d62e1f] mb-4"></div>
                        <p className="text-xl">{t('common.loading')}</p>
                    </div>
                </div>
            </section>
        );
    }

    if (events.length === 0) {
        return (
            <section className="relative h-screen -mt-20 pt-20 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0a0a0a] transition-colors duration-300">
                <div className="absolute inset-0 bg-[url('/images/backg.jpg')] bg-cover bg-center opacity-20 dark:opacity-20" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
                        {t('home.discoverEvents')} <span className="text-[#d62e1f]">{t('events.title')}</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-[#a0a0a0] mb-8 max-w-2xl text-center">
                        {t('home.joinBestEvents')}
                    </p>
                    <div className="hidden md:flex flex-col sm:flex-row gap-4">
                        <Button
                            size="lg"
                            className="liquid-glass-red-button text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-lg"
                            asChild
                        >
                            <Link to="/events">{t('home.exploreEvents')}</Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-2 border-gray-300 dark:border-[#2a2a2a] bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg px-8 transition-colors"
                            asChild
                        >
                            <Link to="/clubs">{t('home.viewClubs')}</Link>
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative h-screen -mt-20 pt-20 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0a0a0a] transition-colors duration-300">
            {events.map((event, index) => {
                const isActive = index === currentSlide;
                const imageUrl = event.imageUrl || '/images/backg.jpg';

                return (
                    <div
                        key={event.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        {/* Background Image with Overlay */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${imageUrl})` }}
                        >
                            <div className="absolute inset-0 bg-black/50" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
                            <div className="max-w-4xl text-center space-y-6">
                                <span className="inline-block bg-[#d62e1f] text-white px-4 py-2 rounded-full text-sm font-bold uppercase">
                                    {t(`enums.category.${event.category}`, event.category)}
                                </span>
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
                                    {event.title}
                                </h1>
                                <p className="text-lg md:text-xl text-[#a0a0a0] max-w-2xl mx-auto line-clamp-2">
                                    {event.description || 'Join us for an amazing event!'}
                                </p>
                                <div className="flex flex-wrap justify-center gap-6 text-sm md:text-base text-white">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-regular fa-calendar text-xl" />
                                        <span>{formatDate(event.startDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-location-dot text-xl" />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                    <button
                                        type="button"
                                        onClick={() => onEventClick(event.id)}
                                        className="liquid-glass-red-button px-8 py-4 text-white rounded-2xl font-bold text-base"
                                    >
                                        {t('home.learnMore')}
                                    </button>
                                    <Button
                                        size="lg"
                                        className="liquid-glass-red-button text-white rounded-2xl px-8 py-4"
                                        asChild
                                    >
                                        <Link to="/events">{t('home.viewAllEvents')}</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Slide Indicators */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                            {events.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`h-3 rounded-full transition-all ${idx === currentSlide
                                        ? 'bg-[#d62e1f] w-8'
                                        : 'liquid-glass-subtle hover:liquid-glass w-3'
                                        }`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>

                        {/* Navigation Arrows - Hidden on mobile */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
                            }}
                            className="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 z-20 liquid-glass-button text-white p-4 rounded-2xl transition-all items-center justify-center"
                            aria-label="Previous slide"
                        >
                            <i className="fa-solid fa-chevron-left text-xl" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentSlide((prev) => (prev + 1) % events.length);
                            }}
                            className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-20 liquid-glass-button text-white p-4 rounded-2xl transition-all items-center justify-center"
                            aria-label="Next slide"
                        >
                            <i className="fa-solid fa-chevron-right text-xl" />
                        </button>
                    </div>
                );
            })}
        </section>
    );
}
