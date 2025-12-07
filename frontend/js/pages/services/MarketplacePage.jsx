import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Plus, Megaphone } from 'lucide-react';
import ServiceCard from '../../components/ServiceCard';
import { Button } from '../../components/ui/button';
import servicesService from '../../services/servicesService';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'PHOTO_VIDEO', label: 'Photo/Video' },
  { value: 'IT', label: 'IT' },
  { value: 'COPYWRITING', label: 'Copywriting' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'OTHER', label: 'Other' },
];

const sortOptions = [
  { value: 'rating', label: 'By Rating' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

export default function MarketplacePage() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  // Load services from backend
  useEffect(() => {
    let isCancelled = false;

    const loadServices = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await servicesService.getAll();

        if (isCancelled) return;

        // Handle different API response formats
        let servicesData = [];
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            servicesData = response;
          } else if (Array.isArray(response.items)) {
            servicesData = response.items;
          } else if (Array.isArray(response.data)) {
            servicesData = response.data;
          } else if (response.services && Array.isArray(response.services)) {
            servicesData = response.services;
          }
        }

        setServices(servicesData);
        setFilteredServices(servicesData);
      } catch (err) {
        console.error('[MarketplacePage] Failed to load services:', err);
        if (isCancelled) return;

        setError(err.response?.data?.message || err.message || 'Failed to load services');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedSort, priceRange, services]);

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
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      default:
        break;
    }

    setFilteredServices(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              Services <span className="text-[#d62e1f]">Marketplace</span>
            </h1>
            <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
              Find professionals for your project
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/services/create')}
              className="rounded-xl bg-gradient-to-r from-[#d62e1f] to-[#b91c1c] hover:from-[#b91c1c] hover:to-[#991b1b] text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Service
            </Button>
            <Button
              onClick={() => navigate('/advertisements/create')}
              variant="outline"
              className="rounded-xl border-[#d62e1f] dark:border-[#d62e1f] text-[#d62e1f] hover:bg-[#d62e1f] hover:text-white transition-all"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Place Advertisement
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
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-12 pr-4 py-3 rounded-lg
                bg-white dark:bg-[#1a1a1a]
                border border-gray-200 dark:border-[#2a2a2a]
                focus:border-[#d62e1f] dark:focus:border-[#d62e1f]
                focus:ring-2 focus:ring-[#d62e1f]/20
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
                bg-white dark:bg-[#1a1a1a]
                border border-gray-200 dark:border-[#2a2a2a]
                focus:border-[#d62e1f] dark:focus:border-[#d62e1f]
                focus:ring-2 focus:ring-[#d62e1f]/20
                text-gray-900 dark:text-white
                outline-none cursor-pointer transition-all
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
                bg-white dark:bg-[#1a1a1a]
                border border-gray-200 dark:border-[#2a2a2a]
                focus:border-[#d62e1f] dark:focus:border-[#d62e1f]
                focus:ring-2 focus:ring-[#d62e1f]/20
                text-gray-900 dark:text-white
                outline-none cursor-pointer transition-all
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
              Filters
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Additional Filters
              </h3>

              <div className="space-y-4">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                    />
                    <span className="text-gray-500">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 100000 })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#d62e1f] mb-4"></div>
            <p className="text-gray-600 dark:text-[#a0a0a0]">Loading services...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="text-[#d62e1f] mb-2">
              <i className="fa-solid fa-exclamation-circle text-4xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading
            </h3>
            <p className="text-gray-600 dark:text-[#a0a0a0]">{error}</p>
          </div>
        )}

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-6 text-sm text-gray-600 dark:text-[#a0a0a0]">
            Services found: {filteredServices.length}
          </div>
        )}

        {/* Services Grid */}
        {!loading && !error && filteredServices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredServices.length === 0 && services.length > 0 && (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Services Found
            </h3>
            <p className="text-gray-600 dark:text-[#a0a0a0]">
              Try adjusting your filters
            </p>
          </div>
        )}

        {/* No Services at All */}
        {!loading && !error && services.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <i className="fa-solid fa-briefcase text-6xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Services Yet
            </h3>
            <p className="text-gray-600 dark:text-[#a0a0a0] mb-4">
              Be the first to post your service!
            </p>
            <Button
              onClick={() => navigate('/services/create')}
              className="liquid-glass-red-button text-white rounded-xl px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Service
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
