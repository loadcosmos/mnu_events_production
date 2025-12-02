import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import eventsService from '../services/eventsService';
import EventModal from '../components/EventModal';
import FilterSheet from '../components/FilterSheet';
import NativeAd from '../components/NativeAd';
import { formatDate } from '../utils/dateFormatters';
import { EVENT_CATEGORIES, CSI_CATEGORIES } from '../utils/constants';
import { getCsiIcon, getCsiColors, getCsiGradientClass, getAllCsiCategories } from '../utils/categoryMappers';

// Mock ads data (will be loaded from API later)
const mockAds = [
  {
    id: 2,
    position: 'NATIVE_FEED',
    imageUrl: '/images/event1.jpg', // Local image from public/images
    linkUrl: 'https://kaspi.kz',
    title: 'Специальное предложение',
    description: 'Получите скидку 20% на все товары!',
  },
];

export default function EventsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCsiTags, setSelectedCsiTags] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalEventId, setModalEventId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Collapsible filter sections
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [statusExpanded, setStatusExpanded] = useState(false);
  const [csiExpanded, setCsiExpanded] = useState(false);
  const [dateExpanded, setDateExpanded] = useState(false);

  const categories = ['ALL', ...Object.values(EVENT_CATEGORIES)];
  const statuses = ['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED'];
  const csiCategories = getAllCsiCategories();

  const openEventModal = (eventId) => {
    setModalEventId(eventId);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalEventId(null), 300);
  };

  const toggleCsiTag = (csiValue) => {
    setSelectedCsiTags((prev) =>
      prev.includes(csiValue)
        ? prev.filter((tag) => tag !== csiValue)
        : [...prev, csiValue]
    );
  };

  // Load events when filters change
  useEffect(() => {
    const debounceTime = searchQuery ? 500 : 300;
    const timer = setTimeout(() => {
      loadEvents();
    }, debounceTime);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus, selectedCsiTags, searchQuery, startDate, endDate]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: 1,
        limit: 100,
      };

      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }

      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (selectedCsiTags.length > 0) {
        params.csiTags = selectedCsiTags.join(',');
      }

      if (startDate) {
        params.startDateFrom = startDate;
      }

      if (endDate) {
        params.startDateTo = endDate;
      }

      const response = await eventsService.getAll(params);

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

      setEvents(eventsData);
    } catch (err) {
      console.error('[EventsPage] Load events failed:', err);
      const errorMessage =
        err.response?.data?.message
          ? Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
          : err.message || 'Failed to load events';
      setError(errorMessage);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery, selectedCsiTags, startDate, endDate]);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Hero Section (Not Sticky) */}
      <div className="py-12 px-4 border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white transition-colors duration-300">
                Discover <span className="text-[#d62e1f]">Events</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Find your next adventure</p>
            </div>
            <button
              onClick={() => navigate('/registrations')}
              className="liquid-glass-red-button text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
            >
              My Registrations
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: Sticky Search Bar and Filters */}
      <div className="hidden md:block sticky top-20 z-30 liquid-glass-strong border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#a0a0a0] text-lg transition-colors duration-300" />
              <Input
                type="search"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-3 rounded-lg border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-2 focus:ring-[#d62e1f]/20 transition-colors duration-300"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${showFilters || (selectedCategory !== 'ALL' || selectedCsiTags.length > 0 || selectedStatus !== 'ALL' || startDate || endDate)
                ? 'bg-[#d62e1f] text-white shadow-lg'
                : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-[#a0a0a0] border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                }`}
            >
              <i className="fa-solid fa-filter" />
              <span>Filters</span>
              {(selectedCategory !== 'ALL' || selectedCsiTags.length > 0 || selectedStatus !== 'ALL' || startDate || endDate) && (
                <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {(selectedCategory !== 'ALL' ? 1 : 0) + selectedCsiTags.length + (selectedStatus !== 'ALL' ? 1 : 0) + (startDate || endDate ? 1 : 0)}
                </span>
              )}
              <i className={`fa-solid fa-chevron-down ml-2 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsible Filters Section */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
            <div className="pb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filter Options</h3>
                {(selectedCategory !== 'ALL' || selectedCsiTags.length > 0 || selectedStatus !== 'ALL' || startDate || endDate) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedCsiTags([]);
                      setSelectedStatus('ALL');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-sm text-[#d62e1f] hover:text-[#ff4433] font-semibold flex items-center gap-1"
                  >
                    <i className="fa-solid fa-xmark" />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Section: Categories */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-[#666666] mb-3 uppercase tracking-wider">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${selectedCategory === cat
                          ? 'liquid-glass-red-button text-white'
                          : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: CSI Tags */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-[#666666] mb-3 uppercase tracking-wider">
                    CSI Attributes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {csiCategories.map((csi) => {
                      const isSelected = selectedCsiTags.includes(csi.value);
                      const gradientClass = getCsiGradientClass(csi.value);
                      return (
                        <button
                          key={csi.value}
                          onClick={() => toggleCsiTag(csi.value)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isSelected
                            ? `bg-gradient-to-r ${gradientClass} text-white shadow-lg`
                            : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                          <span className="mr-1.5">{getCsiIcon(csi.value)}</span>
                          {csi.label.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Date Range */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-[#666666] mb-3 uppercase tracking-wider">
                    Date Range
                  </h3>
                  <div className="flex gap-3 items-center flex-wrap">
                    <div className="flex-1 min-w-[200px] max-w-xs">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:border-[#d62e1f] focus:ring-2 focus:ring-[#d62e1f]/20 outline-none transition-colors duration-300"
                      />
                    </div>
                    <span className="text-gray-500 dark:text-[#666666] font-medium">—</span>
                    <div className="flex-1 min-w-[200px] max-w-xs">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:border-[#d62e1f] focus:ring-2 focus:ring-[#d62e1f]/20 outline-none transition-colors duration-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Compact Sticky Bar with Icons */}
      <div className="md:hidden sticky top-20 z-30 liquid-glass-strong border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Search Icon */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#2a2a2a] text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300"
          >
            <i className="fa-solid fa-magnifying-glass text-lg" />
            <span className="text-sm">Search events...</span>
          </button>

          {/* Filter Icon */}
          <button
            onClick={() => setFilterSheetOpen(true)}
            className="liquid-glass-red-button text-white p-3 rounded-2xl"
            aria-label="Open filters"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Search Expanded */}
        {mobileSearchOpen && (
          <div className="px-4 pb-3">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#a0a0a0] text-lg transition-colors duration-300" />
              <Input
                type="search"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="pl-12 pr-6 py-3 rounded-lg border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-2 focus:ring-[#d62e1f]/20 transition-colors duration-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Events Grid */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-8 p-6 rounded-lg bg-white dark:bg-[#1a1a1a] border border-[#d62e1f]/50 transition-colors duration-300">
              <div className="flex items-center gap-3 text-[#d62e1f]">
                <i className="fa-solid fa-exclamation-circle text-xl" />
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-[#2a2a2a] border-t-[#d62e1f]"></div>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <i className="fa-regular fa-calendar-xmark text-5xl text-gray-400 dark:text-[#666666] mb-6 transition-colors duration-300"></i>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">No events found</h3>
              <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">{sortedEvents.length}</span>{' '}
                  {sortedEvents.length === 1 ? 'event' : 'events'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  const contentWithAds = [];
                  const nativeAd = mockAds.find((ad) => ad.position === 'NATIVE_FEED');

                  sortedEvents.forEach((event, index) => {
                    const imageUrl = event.imageUrl || '/images/backg.jpg';

                    contentWithAds.push(
                      <div
                        key={event.id}
                        className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer group shadow-lg hover:shadow-2xl flex flex-col"
                        onClick={() => openEventModal(event.id)}
                      >
                        {/* Image Section - Fixed Height, No Scroll */}
                        <div className="relative h-48 md:h-52 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
                          <img
                            src={imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.src = '/images/event-placeholder.jpg';
                            }}
                          />
                          {/* Subtle gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        </div>

                        {/* Content Section - Strict Vertical Layout with Proper Padding */}
                        <div className="flex-1 flex flex-col px-5 py-5 md:px-6 md:py-6 space-y-4">
                          {/* Category Badge and CSI Tags */}
                          <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
                            <span className="inline-block bg-[#d62e1f] text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide">
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

                          {/* Date/Time - MNU Red + Bold */}
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            <i className="fa-regular fa-calendar text-[#d62e1f] text-base" />
                            <span className="text-base font-bold text-[#d62e1f]">{formatDate(event.startDate)}</span>
                          </div>

                          {/* Event Title - Large + Bold */}
                          <h3 className="text-2xl md:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight flex-shrink-0 transition-colors duration-300">
                            {event.title}
                          </h3>

                          {/* Description - Controlled Height */}
                          <p className="text-gray-600 dark:text-[#a0a0a0] text-sm leading-relaxed line-clamp-2 flex-shrink-0 transition-colors duration-300">
                            {event.description}
                          </p>

                          {/* Meta Info - Vertical Stack */}
                          <div className="flex flex-col gap-2.5 pt-4 border-t border-gray-200 dark:border-[#2a2a2a] flex-shrink-0 transition-colors duration-300">
                            {/* Location */}
                            <div className="flex items-center gap-2.5">
                              <i className="fa-solid fa-location-dot text-[#d62e1f] text-base flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-600 dark:text-[#a0a0a0] truncate transition-colors duration-300">{event.location}</span>
                            </div>
                            {/* Capacity */}
                            <div className="flex items-center gap-2.5">
                              <i className="fa-solid fa-users text-[#d62e1f] text-base flex-shrink-0" />
                              <span className="text-sm font-semibold text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                                {event._count?.registrations || 0} / {event.capacity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    // Insert native ad after every 3 events
                    if ((index + 1) % 3 === 0 && nativeAd) {
                      contentWithAds.push(<NativeAd key={`ad-${index}`} ad={nativeAd} />);
                    }
                  });

                  return contentWithAds;
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      <FilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter Events"
      >
        <div className="space-y-4">
          {/* Category Filter - Collapsible */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden transition-colors duration-300">
            <button
              onClick={() => setCategoryExpanded(!categoryExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors"
            >
              <span>Category</span>
              <i
                className={`fa-solid fa-chevron-down text-sm transition-transform ${categoryExpanded ? 'rotate-180' : ''
                  }`}
              />
            </button>
            {categoryExpanded && (
              <div className="p-3 space-y-2 bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
                {categories.map((category) => (
                  <label
                    key={category}
                    className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-colors ${selectedCategory === category
                      ? 'liquid-glass-red-button text-white'
                      : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category}
                      onChange={() => setSelectedCategory(category)}
                      className="mr-3 accent-[#d62e1f]"
                    />
                    {category}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter - Collapsible */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden transition-colors duration-300">
            <button
              onClick={() => setStatusExpanded(!statusExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors"
            >
              <span>Status</span>
              <i
                className={`fa-solid fa-chevron-down text-sm transition-transform ${statusExpanded ? 'rotate-180' : ''
                  }`}
              />
            </button>
            {statusExpanded && (
              <div className="p-3 space-y-2 bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
                {statuses.map((status) => (
                  <label
                    key={status}
                    className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-colors ${selectedStatus === status
                      ? 'liquid-glass-red-button text-white'
                      : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={selectedStatus === status}
                      onChange={() => setSelectedStatus(status)}
                      className="mr-3 accent-[#d62e1f]"
                    />
                    {status}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* CSI Tags Filter - Collapsible */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden transition-colors duration-300">
            <button
              onClick={() => setCsiExpanded(!csiExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors"
            >
              <span>CSI</span>
              <i
                className={`fa-solid fa-chevron-down text-sm transition-transform ${csiExpanded ? 'rotate-180' : ''
                  }`}
              />
            </button>
            {csiExpanded && (
              <div className="p-3 space-y-2 bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
                {csiCategories.map((csi) => {
                  const isSelected = selectedCsiTags.includes(csi.value);
                  const gradientClass = getCsiGradientClass(csi.value);
                  return (
                    <label
                      key={csi.value}
                      className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${isSelected
                        ? `bg-gradient-to-r ${gradientClass} text-white shadow-lg`
                        : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCsiTag(csi.value)}
                        className="mr-3 accent-[#d62e1f]"
                      />
                      <span className="mr-2">{getCsiIcon(csi.value)}</span>
                      {csi.label.toUpperCase()}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date Range Filter - Collapsible */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden transition-colors duration-300">
            <button
              onClick={() => setDateExpanded(!dateExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors"
            >
              <span>Date Range</span>
              <i
                className={`fa-solid fa-chevron-down text-sm transition-transform ${dateExpanded ? 'rotate-180' : ''
                  }`}
              />
            </button>
            {dateExpanded && (
              <div className="p-4 space-y-4 bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
                <div>
                  <label className="block text-gray-600 dark:text-[#a0a0a0] text-sm mb-2 transition-colors duration-300">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#d62e1f] focus:ring-2 focus:ring-[#d62e1f]/20 outline-none transition-colors duration-300"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-[#a0a0a0] text-sm mb-2 transition-colors duration-300">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#d62e1f] focus:ring-2 focus:ring-[#d62e1f]/20 outline-none transition-colors duration-300"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </FilterSheet>

      <EventModal eventId={modalEventId} isOpen={isModalOpen} onClose={closeEventModal} />
    </div>
  );
}
