import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Plus, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import eventsService from '../services/eventsService';
import registrationsService from '../services/registrationsService';
import adsService from '../services/adsService';
import EventModal from '../components/EventModal';
import AdBanner from '../components/AdBanner';
import AdModal from '../components/AdModal';
import ServiceCard from '../components/ServiceCard';
import { formatDate } from '../utils/dateFormatters';
import { COLORS } from '../utils/constants';
import { getCsiIcon, getCsiColors } from '../utils/categoryMappers';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect organizers and admins to their pages
  useEffect(() => {
    if (isAuthenticated() && user) {
      if (user.role === 'ORGANIZER') {
        navigate('/organizer', { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const [trendingEvents, setTrendingEvents] = useState([]);
  const [myUpcomingEvents, setMyUpcomingEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [modalEventId, setModalEventId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ad state management
  const [ads, setAds] = useState({
    topBanner: null,
    nativeFeed: null,
    bottomBanner: null,
  });
  const [selectedAd, setSelectedAd] = useState(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  // Services/Marketplace state management
  const mockServices = [
    {
      id: 1,
      type: 'GENERAL',
      title: 'Professional Logo Design',
      description: 'I will create a unique logo for your business with unlimited revisions',
      category: 'DESIGN',
      price: 15000,
      priceType: 'FIXED',
      rating: 4.8,
      reviewCount: 24,
      imageUrl: 'https://via.placeholder.com/400x300?text=Logo+Design',
      provider: {
        firstName: 'Айдар',
        lastName: 'Султанов',
        faculty: 'Design',
      },
    },
    {
      id: 2,
      type: 'GENERAL',
      title: 'Professional Photography',
      description: 'Event photography, portraits, product photography',
      category: 'PHOTO_VIDEO',
      price: 20000,
      priceType: 'HOURLY',
      rating: 4.9,
      reviewCount: 42,
      imageUrl: 'https://via.placeholder.com/400x300?text=Photography',
      provider: {
        firstName: 'Дина',
        lastName: 'Ахметова',
        faculty: 'Media Arts',
      },
    },
    {
      id: 3,
      type: 'GENERAL',
      title: 'Web Development Services',
      description: 'Full-stack web development: React, Node.js, PostgreSQL',
      category: 'IT',
      price: 25000,
      priceType: 'FIXED',
      rating: 4.9,
      reviewCount: 31,
      imageUrl: 'https://via.placeholder.com/400x300?text=Web+Development',
      provider: {
        firstName: 'Ерлан',
        lastName: 'Бекназаров',
        faculty: 'Computer Science',
      },
    },
  ];

  const categories = [
    { value: 'all', label: 'Все категории' },
    { value: 'DESIGN', label: 'Дизайн' },
    { value: 'PHOTO_VIDEO', label: 'Фото/Видео' },
    { value: 'IT', label: 'IT' },
    { value: 'COPYWRITING', label: 'Копирайтинг' },
    { value: 'CONSULTING', label: 'Консультации' },
    { value: 'OTHER', label: 'Другое' },
  ];

  const sortOptions = [
    { value: 'rating', label: 'По рейтингу' },
    { value: 'price-asc', label: 'Цена: возрастание' },
    { value: 'price-desc', label: 'Цена: убывание' },
    { value: 'newest', label: 'Сначала новые' },
  ];

  const [services, setServices] = useState(mockServices);
  const [filteredServices, setFilteredServices] = useState(mockServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  const openEventModal = (eventId) => {
    setModalEventId(eventId);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalEventId(null), 300);
  };

  const openAdModal = (ad) => {
    setSelectedAd(ad);
    setIsAdModalOpen(true);
  };

  const closeAdModal = () => {
    setIsAdModalOpen(false);
    setTimeout(() => setSelectedAd(null), 300);
  };

  const handleAdImpression = async (adId) => {
    try {
      await adsService.trackImpression(adId);
    } catch (err) {
      console.error('[HomePage] Failed to track ad impression:', err);
    }
  };

  const handleAdClick = async (adId) => {
    try {
      await adsService.trackClick(adId);
    } catch (err) {
      console.error('[HomePage] Failed to track ad click:', err);
    }
  };

  // Services filtering logic
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedSort, priceRange]);

  const applyFilters = () => {
    let filtered = [...services];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((service) => service.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(
      (service) => service.price >= priceRange.min && service.price <= priceRange.max
    );

    // Sort
    switch (selectedSort) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Would sort by createdAt if available
        break;
    }

    setFilteredServices(filtered);
  };

  // Load events on mount
  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // Load events for next 3 months
        const today = new Date();
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

        const response = await eventsService.getAll({
          page: 1,
          limit: 100,
          startDateFrom: today.toISOString().split('T')[0],
          startDateTo: threeMonthsLater.toISOString().split('T')[0],
        });

        if (isCancelled) return;

        // Handle different API response formats
        let eventsData = [];
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            eventsData = response;
          } else if (Array.isArray(response.data)) {
            eventsData = response.data;
          } else if (response.events && Array.isArray(response.events)) {
            eventsData = response.events;
          }
        }

        // Trending Events - Sort by registration count (most popular first)
        const trendingByPopularity = [...eventsData].sort(
          (a, b) => {
            const aCount = a._count?.registrations || 0;
            const bCount = b._count?.registrations || 0;
            // If registration counts are equal, sort by date
            if (bCount === aCount) {
              return new Date(a.startDate) - new Date(b.startDate);
            }
            return bCount - aCount;
          }
        );

        if (isCancelled) return;

        // Trending This Week - Top 6 most popular events
        setTrendingEvents(trendingByPopularity.slice(0, 6));

        // If authenticated, load user's registered events and recommendations
        if (isAuthenticated() && user) {
          try {
            const registrationsResponse = await registrationsService.getMyRegistrations();

            if (isCancelled) return;

            const registrations = registrationsResponse.data || registrationsResponse || [];

            // Extract upcoming events from registrations
            const upcomingRegistered = registrations
              .filter(reg => {
                const eventDate = new Date(reg.event?.startDate);
                return eventDate >= today && reg.status === 'REGISTERED';
              })
              .map(reg => reg.event)
              .filter(event => event) // Remove null/undefined
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
              .slice(0, 6);

            if (isCancelled) return;

            setMyUpcomingEvents(upcomingRegistered);

            // If user has no upcoming registrations, show recommendations based on clubs
            if (upcomingRegistered.length === 0) {
              // Get events from clubs the user is a member of
              // For now, show events sorted by date as recommendations
              // TODO: In the future, fetch user's club memberships and filter events by those clubs
              const recommendedByDate = [...eventsData]
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 6);

              setRecommendedEvents(recommendedByDate);
            } else {
              setRecommendedEvents([]);
            }
          } catch (err) {
            console.error('[HomePage] Failed to load registrations:', err);
            // Don't show error, just don't show the section
          }
        }
      } catch (err) {
        console.error('[HomePage] Load events failed:', err);
        if (isCancelled) return;

        const errorMessage =
          err.response?.data?.message
            ? Array.isArray(err.response.data.message)
              ? err.response.data.message.join(', ')
              : err.response.data.message
            : err.message || 'Failed to load events';
        setError(errorMessage);
        setTrendingEvents([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, user]);

  // Load ads on mount
  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        // Load ads for different positions
        const [topBannerAds, nativeFeedAds, bottomBannerAds] = await Promise.all([
          adsService.getActive('TOP_BANNER'),
          adsService.getActive('NATIVE_FEED'),
          adsService.getActive('BOTTOM_BANNER'),
        ]);

        if (isCancelled) return;

        setAds({
          topBanner: topBannerAds?.[0] || null,
          nativeFeed: nativeFeedAds?.[0] || null,
          bottomBanner: bottomBannerAds?.[0] || null,
        });
      } catch (err) {
        console.error('[HomePage] Failed to load ads:', err);
        // Don't show error to user, just don't display ads
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (trendingEvents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trendingEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [trendingEvents.length]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Hero Section - Event Slider */}
      <section className="relative h-screen -mt-20 pt-20 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0a0a0a] transition-colors duration-300">
        {loading ? (
          // Loading state
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-900 dark:text-white">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#d62e1f] mb-4"></div>
              <p className="text-xl">Loading events...</p>
            </div>
          </div>
        ) : trendingEvents.length === 0 ? (
          // Fallback when no events
          <>
            <div className="absolute inset-0 bg-[url('/images/backg.jpg')] bg-cover bg-center opacity-20 dark:opacity-20" />
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
                Discover <span className="text-[#d62e1f]">Events</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-[#a0a0a0] mb-8 max-w-2xl text-center">
                Join the best university events at MNU
              </p>
              <div className="hidden md:flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="liquid-glass-red-button text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-lg"
                  asChild
                >
                  <Link to="/events">Explore Events</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 dark:border-[#2a2a2a] bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg px-8 transition-colors"
                  asChild
                >
                  <Link to="/clubs">View Clubs</Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Event Slider
          <>
            {trendingEvents.map((event, index) => {
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
                        {event.category}
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
                          onClick={() => openEventModal(event.id)}
                          className="liquid-glass-red-button px-8 py-4 text-white rounded-2xl font-bold text-base"
                        >
                          Learn More
                        </button>
                        <Button
                          size="lg"
                          className="liquid-glass-red-button text-white rounded-2xl px-8 py-4"
                          asChild
                        >
                          <Link to="/events">View All Events</Link>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Slide Indicators */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                    {trendingEvents.map((_, idx) => (
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
                      setCurrentSlide(
                        (prev) => (prev - 1 + trendingEvents.length) % trendingEvents.length
                      );
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
                      setCurrentSlide((prev) => (prev + 1) % trendingEvents.length);
                    }}
                    className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-20 liquid-glass-button text-white p-4 rounded-2xl transition-all items-center justify-center"
                    aria-label="Next slide"
                  >
                    <i className="fa-solid fa-chevron-right text-xl" />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </section>

      {/* Top Banner Ad */}
      {ads.topBanner && (
        <AdBanner
          ad={ads.topBanner}
          position="TOP_BANNER"
          onImpression={handleAdImpression}
          onClick={openAdModal}
        />
      )}

      {/* Services/Marketplace Section */}
      <section className="py-16 px-4 bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                Marketplace <span className="text-[#d62e1f]">услуг</span>
              </h2>
              <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                Найдите профессионалов для вашего проекта
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/services/create')}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Service
              </Button>
              <Button
                onClick={() => navigate('/advertisements/create')}
                variant="outline"
                className="rounded-xl border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Post Ad
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск услуг..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-12 pr-4 py-3 rounded-lg
                  bg-white dark:bg-[#0a0a0a]
                  border border-gray-200 dark:border-[#2a2a2a]
                  focus:border-purple-500 dark:focus:border-purple-500
                  focus:ring-2 focus:ring-purple-500/20
                  text-gray-900 dark:text-white
                  outline-none transition-all
                "
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="
                  px-4 py-2 rounded-lg
                  bg-white dark:bg-[#0a0a0a]
                  border border-gray-200 dark:border-[#2a2a2a]
                  focus:border-purple-500 dark:focus:border-purple-500
                  focus:ring-2 focus:ring-purple-500/20
                  text-gray-900 dark:text-white
                  outline-none
                "
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Sort Filter */}
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="
                  px-4 py-2 rounded-lg
                  bg-white dark:bg-[#0a0a0a]
                  border border-gray-200 dark:border-[#2a2a2a]
                  focus:border-purple-500 dark:focus:border-purple-500
                  focus:ring-2 focus:ring-purple-500/20
                  text-gray-900 dark:text-white
                  outline-none
                "
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Advanced Filters Button */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2 border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Фильтры
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Дополнительные фильтры
                </h3>

                <div className="space-y-4">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Диапазон цен
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        placeholder="Мин"
                        value={priceRange.min}
                        onChange={(e) =>
                          setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })
                        }
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                      />
                      <span className="text-gray-500">—</span>
                      <input
                        type="number"
                        placeholder="Макс"
                        value={priceRange.max}
                        onChange={(e) =>
                          setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 100000 })
                        }
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-6 text-sm text-gray-600 dark:text-[#a0a0a0]">
            Найдено услуг: {filteredServices.length}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {/* Empty State */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Услуги не найдены
              </h3>
              <p className="text-gray-600 dark:text-[#a0a0a0]">
                Попробуйте изменить параметры фильтрации
              </p>
            </div>
          )}
        </div>
      </section>


      {/* My Upcoming Events - Horizontal Scroll (Only for authenticated users) */}
      {isAuthenticated() && myUpcomingEvents.length > 0 && (
        <section className="py-16 px-4 bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  My <span className="text-[#d62e1f]">Upcoming Events</span>
                </h2>
                <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Events you're registered for</p>
              </div>
              <Link
                to="/registrations"
                className="hidden md:flex items-center gap-2 text-[#d62e1f] font-semibold hover:text-[#ff4433] transition-colors"
              >
                View All
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-6 min-w-max">
                {myUpcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="w-80 bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer group shadow-lg hover:shadow-2xl"
                    onClick={() => openEventModal(event.id)}
                  >
                    {/* Enhanced Image with Gradient */}
                    <div className="relative">
                      <img
                        src={event.imageUrl || '/images/event-placeholder.jpg'}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '/images/event-placeholder.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Enhanced Content */}
                    <div className="p-5 md:p-6 space-y-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="inline-block bg-[#d62e1f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md">
                          {event.category}
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
                        <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                          <i className="fa-regular fa-calendar text-sm" />
                          <span className="text-sm font-medium">{formatDate(event.startDate)}</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#d62e1f] transition-colors leading-tight">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] pt-2 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                        <i className="fa-solid fa-location-dot text-base text-[#d62e1f]" />
                        <span className="text-sm font-medium line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile View All Link */}
            <div className="md:hidden mt-6 text-center">
              <Link
                to="/registrations"
                className="inline-flex items-center gap-2 text-[#d62e1f] font-semibold px-6 py-3 rounded-lg border-2 border-[#d62e1f] hover:bg-[#d62e1f] hover:text-white transition-all"
              >
                View All My Events
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recommended For You - Horizontal Scroll (Only for authenticated users with no registrations) */}
      {isAuthenticated() && myUpcomingEvents.length === 0 && recommendedEvents.length > 0 && (
        <section className="py-16 px-4 bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  Recommended <span className="text-[#d62e1f]">For You</span>
                </h2>
                <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Events you might enjoy based on your interests</p>
              </div>
              <Link
                to="/events"
                className="hidden md:flex items-center gap-2 text-[#d62e1f] font-semibold hover:text-[#ff4433] transition-colors"
              >
                View All
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-6 min-w-max">
                {recommendedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="w-80 bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer group shadow-lg hover:shadow-2xl"
                    onClick={() => openEventModal(event.id)}
                  >
                    {/* Enhanced Image with Gradient */}
                    <div className="relative">
                      <img
                        src={event.imageUrl || '/images/event-placeholder.jpg'}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '/images/event-placeholder.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Enhanced Content */}
                    <div className="p-4 md:p-5 lg:p-6 space-y-3 overflow-hidden">
                      {/* Category and CSI Tags */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block bg-[#d62e1f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md">
                          {event.category}
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

                      {/* Date/Time - Red and Bold */}
                      <div className="flex items-center gap-2">
                        <i className="fa-regular fa-calendar text-sm text-[#d62e1f]" />
                        <span className="text-sm md:text-base font-bold text-[#d62e1f]">{formatDate(event.startDate)}</span>
                      </div>

                      {/* Title - Large and Bold */}
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#d62e1f] transition-colors leading-tight">
                        {event.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 dark:text-[#a0a0a0] text-sm line-clamp-2 leading-relaxed transition-colors duration-300">
                        {event.description}
                      </p>

                      {/* Meta Info - Vertical Layout */}
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
                ))}
              </div>
            </div>

            {/* Mobile View All Link */}
            <div className="md:hidden mt-6 text-center">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 text-[#d62e1f] font-semibold px-6 py-3 rounded-lg border-2 border-[#d62e1f] hover:bg-[#d62e1f] hover:text-white transition-all"
              >
                View All Events
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Native Feed Ad */}
      {ads.nativeFeed && (
        <AdBanner
          ad={ads.nativeFeed}
          position="NATIVE_FEED"
          onImpression={handleAdImpression}
          onClick={openAdModal}
        />
      )}

      {/* Trending This Week - Horizontal Scroll */}
      <section className="py-16 px-4 bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                Trending <span className="text-[#d62e1f]">This Week</span>
              </h2>
              <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Most popular events by registrations</p>
            </div>
            <Link
              to="/events"
              className="hidden md:flex items-center gap-2 text-[#d62e1f] font-semibold hover:text-[#ff4433] transition-colors"
            >
              View All
              <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#2a2a2a] border-t-[#d62e1f]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <i className="fa-solid fa-exclamation-circle text-4xl text-[#d62e1f] mb-4"></i>
              <p className="text-gray-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Failed to load events</p>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">{error}</p>
            </div>
          ) : trendingEvents.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <i className="fa-regular fa-calendar-xmark text-4xl text-gray-400 dark:text-[#666666] mb-4 transition-colors duration-300"></i>
              <p className="text-gray-900 dark:text-white font-semibold mb-2 transition-colors duration-300">No upcoming events</p>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Check back later for new events!</p>
            </div>
          ) : (
            <>
              {/* Horizontal Scroll Container */}
              <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-6 min-w-max">
                  {trendingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="w-80 bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer group shadow-lg hover:shadow-2xl"
                      onClick={() => openEventModal(event.id)}
                    >
                      {/* Enhanced Image with Gradient */}
                      <div className="relative">
                        <img
                          src={event.imageUrl || '/images/event-placeholder.jpg'}
                          alt={event.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = '/images/event-placeholder.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Enhanced Content */}
                      <div className="p-4 md:p-5 lg:p-6 space-y-3 overflow-hidden">
                        {/* Category and CSI Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-block bg-[#d62e1f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md">
                            {event.category}
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

                        {/* Date/Time - Red and Bold */}
                        <div className="flex items-center gap-2">
                          <i className="fa-regular fa-calendar text-sm text-[#d62e1f]" />
                          <span className="text-sm md:text-base font-bold text-[#d62e1f]">{formatDate(event.startDate)}</span>
                        </div>

                        {/* Title - Large and Bold */}
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#d62e1f] transition-colors leading-tight">
                          {event.title}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-[#a0a0a0] text-sm line-clamp-2 leading-relaxed transition-colors duration-300">
                          {event.description}
                        </p>

                        {/* Meta Info - Vertical Layout */}
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
                  ))}
                </div>
              </div>

              {/* Mobile View All Link */}
              <div className="md:hidden mt-6 text-center">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 text-[#d62e1f] font-semibold px-6 py-3 rounded-lg border-2 border-[#d62e1f] hover:bg-[#d62e1f] hover:text-white transition-all"
                >
                  View All Events
                  <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Bottom Banner Ad */}
      {ads.bottomBanner && (
        <AdBanner
          ad={ads.bottomBanner}
          position="BOTTOM_BANNER"
          onImpression={handleAdImpression}
          onClick={openAdModal}
        />
      )}

      {/* Event Modal */}
      <EventModal eventId={modalEventId} isOpen={isModalOpen} onClose={closeEventModal} />

      {/* Ad Modal */}
      <AdModal ad={selectedAd} isOpen={isAdModalOpen} onClose={closeAdModal} />

      {/* Custom Scrollbar Hide Style */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
