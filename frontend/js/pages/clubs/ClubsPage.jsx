import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { useClubs } from '../../hooks/useClubs';
import FilterSheet from '../../components/FilterSheet';
import { CLUB_CATEGORIES, CSI_CATEGORIES } from '../../utils/constants';
import { getCsiIcon, getCsiGradientClass, getAllCsiCategories } from '../../utils/categoryMappers';
import { sanitizeText } from '../../utils/sanitize';
import { useTranslation } from 'react-i18next';

export default function ClubsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCsiTags, setSelectedCsiTags] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopFiltersExpanded, setDesktopFiltersExpanded] = useState(false);

  // Collapsible filter sections
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [csiExpanded, setCsiExpanded] = useState(false);
  const [dateExpanded, setDateExpanded] = useState(false);

  const categories = ['ALL', ...Object.values(CLUB_CATEGORIES)];
  const csiCategories = getAllCsiCategories();

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query params for React Query
  const queryParams = useMemo(() => {
    const params = { page: 1, limit: 100 };

    if (selectedCategory !== 'ALL') params.category = selectedCategory;
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedCsiTags.length > 0) params.csiCategories = selectedCsiTags.join(',');
    if (startDate) params.createdFrom = startDate;
    if (endDate) params.createdTo = endDate;

    return params;
  }, [selectedCategory, debouncedSearch, selectedCsiTags, startDate, endDate]);

  // Fetch clubs using React Query (automatic caching!)
  const { data: clubs = [], isLoading: loading, error: queryError } = useClubs(queryParams);

  const error = queryError?.message || '';

  const toggleCsiTag = (csiValue) => {
    setSelectedCsiTags((prev) =>
      prev.includes(csiValue)
        ? prev.filter((tag) => tag !== csiValue)
        : [...prev, csiValue]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Hero Section (Not Sticky) */}
      <div className="py-12 px-4 border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            {t('clubs.title').split(' ')[0]} <span className="text-[#d62e1f]">{t('clubs.title').split(' ')[1]}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">{t('clubs.subtitle')}</p>
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
                placeholder={t('clubs.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-3 rounded-lg border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-2 focus:ring-[#d62e1f]/20 transition-colors duration-300"
              />
            </div>

            <button
              onClick={() => setDesktopFiltersExpanded(!desktopFiltersExpanded)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${desktopFiltersExpanded || (selectedCategory !== 'ALL' || selectedCsiTags.length > 0 || startDate || endDate)
                ? 'bg-[#d62e1f] text-white shadow-lg'
                : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-[#a0a0a0] border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                }`}
            >
              <i className="fa-solid fa-filter" />
              <span>{t('clubs.filters')}</span>
              {(selectedCategory !== 'ALL' || selectedCsiTags.length > 0 || startDate || endDate) && (
                <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {(selectedCategory !== 'ALL' ? 1 : 0) + selectedCsiTags.length + (startDate || endDate ? 1 : 0)}
                </span>
              )}
              <i className={`fa-solid fa-chevron-down ml-2 transition-transform duration-300 ${desktopFiltersExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsible Filters Section */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${desktopFiltersExpanded ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
            <div className="pb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('clubs.filterOptions')}</h3>
                {(selectedCategory !== 'ALL' || selectedCsiTags.length > 0 || startDate || endDate) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedCsiTags([]);
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-sm text-[#d62e1f] hover:text-[#ff4433] font-semibold flex items-center gap-1"
                  >
                    <i className="fa-solid fa-xmark" />
                    {t('clubs.clearAll')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Section: Categories */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-[#666666] mb-3 uppercase tracking-wider">
                    {t('clubs.categories')}
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
                        {t(`enums.clubCategory.${cat}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: CSI Tags */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-[#666666] mb-3 uppercase tracking-wider">
                    {t('clubs.csiAttributes')}
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
                          {t(`enums.csiCategory.${csi.value}`).toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Date Range */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-[#666666] mb-3 uppercase tracking-wider">
                    {t('clubs.dateRange')}
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
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="flex-1 flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#2a2a2a] text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300"
          >
            <i className="fa-solid fa-magnifying-glass text-lg" />
            <span className="text-sm">{t('clubs.searchPlaceholder')}</span>
          </button>

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

        {mobileSearchOpen && (
          <div className="px-4 pb-3">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#a0a0a0] text-lg transition-colors duration-300" />
              <Input
                type="search"
                placeholder={t('clubs.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="pl-12 pr-6 py-3 rounded-lg border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-2 focus:ring-[#d62e1f]/20 transition-colors duration-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Clubs Grid */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-8 p-6 rounded-lg bg-white dark:bg-[#1a1a1a] border border-red-300 dark:border-[#d62e1f]/50 transition-colors duration-300">
              <div className="flex items-center gap-3 text-[#d62e1f]">
                <i className="fa-solid fa-exclamation-circle text-xl" />
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-[#2a2a2a] border-t-[#d62e1f]"></div>
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <i className="fa-regular fa-users text-5xl text-gray-400 dark:text-[#666666] mb-6 transition-colors duration-300"></i>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{t('clubs.noClubsFound')}</h3>
              <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                {error ? t('clubs.failedToLoad') : t('clubs.tryAdjustingFilters')}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                  {t('clubs.showing')} <span className="font-semibold text-gray-900 dark:text-white">{clubs.length}</span>{' '}
                  {clubs.length === 1 ? t('clubs.club') : t('clubs.clubs')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => {
                  const imageUrl = club.imageUrl || club.image || '/images/event-placeholder.jpg';
                  const membersCount = club._count?.members || club.members || 0;

                  return (
                    <div
                      key={club.id}
                      className="bg-white dark:bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer group shadow-lg hover:shadow-2xl"
                      onClick={() => navigate(`/clubs/${club.id}`)}
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-[#0a0a0a]">
                        <img
                          src={imageUrl}
                          alt={club.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = '/images/event-placeholder.jpg';
                          }}
                        />
                        <div className="absolute inset-0 liquid-glass-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-3 right-3 px-3 py-1.5 bg-[#d62e1f] text-white rounded text-xs font-bold uppercase">
                          {t(`enums.clubCategory.${club.category}`)}
                        </div>
                      </div>

                      <div className="p-4 md:p-5 lg:p-6 space-y-3 md:space-y-4 overflow-hidden">
                        {/* Category */}
                        <div>
                          <span className="inline-block bg-[#d62e1f] text-white px-3 py-1.5 rounded text-xs font-bold uppercase">
                            {t(`enums.clubCategory.${club.category}`)}
                          </span>
                        </div>

                        {/* Title - Large and Bold */}
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#d62e1f] transition-colors">
                          {club.name}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-[#a0a0a0] text-sm line-clamp-3 transition-colors duration-300">
                          {sanitizeText(club.description) || t('clubs.noDescription')}
                        </p>

                        {/* Meta Info - Vertical Layout */}
                        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                          <div className="flex items-center text-gray-600 dark:text-[#a0a0a0] text-sm transition-colors duration-300">
                            <i className="fa-solid fa-users mr-2 text-[#d62e1f] flex-shrink-0" />
                            <span className="line-clamp-1">
                              {membersCount} {membersCount === 1 ? t('clubs.member') : t('clubs.members')}
                            </span>
                          </div>
                          {club.organizer && (
                            <div className="flex items-center text-gray-600 dark:text-[#a0a0a0] text-sm transition-colors duration-300">
                              <i className="fa-solid fa-user-tie mr-2 text-[#d62e1f] flex-shrink-0" />
                              <span className="line-clamp-1">
                                {club.organizer.firstName} {club.organizer.lastName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <FilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title={t('clubs.filterClubs')}
      >
        <div className="space-y-4">
          {/* Category Filter - Collapsible */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden transition-colors duration-300">
            <button
              onClick={() => setCategoryExpanded(!categoryExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors"
            >
              <span>{t('clubs.category')}</span>
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
                      : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category}
                      onChange={() => setSelectedCategory(category)}
                      className="mr-3 accent-[#d62e1f]"
                    />
                    {t(`enums.clubCategory.${category}`)}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* CSI Filter - Collapsible */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden transition-colors duration-300">
            <button
              onClick={() => setCsiExpanded(!csiExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors"
            >
              <span>{t('clubs.csi')}</span>
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
                      {t(`enums.csiCategory.${csi.value}`).toUpperCase()}
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
              <span>{t('clubs.dateRange')}</span>
              <i
                className={`fa-solid fa-chevron-down text-sm transition-transform ${dateExpanded ? 'rotate-180' : ''
                  }`}
              />
            </button>
            {dateExpanded && (
              <div className="p-4 space-y-4 bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
                <div>
                  <label className="block text-gray-600 dark:text-[#a0a0a0] text-sm mb-2 transition-colors duration-300">{t('clubs.fromDate')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#d62e1f] focus:ring-2 focus:ring-[#d62e1f]/20 outline-none transition-colors duration-300"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-[#a0a0a0] text-sm mb-2 transition-colors duration-300">{t('clubs.toDate')}</label>
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
                    {t('clubs.clearDates')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </FilterSheet>
    </div>
  );
}
