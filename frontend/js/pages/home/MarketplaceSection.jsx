import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Plus, Megaphone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import ServiceCard from '../../components/ServiceCard';
import { useServices } from '../../hooks/useServices';

/**
 * MarketplaceSection - Services marketplace with search and filters
 * Now uses React Query for caching and automatic refetching
 */

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'DESIGN', label: 'Design' },
    { value: 'PHOTO_VIDEO', label: 'Photo/Video' },
    { value: 'IT', label: 'IT' },
    { value: 'COPYWRITING', label: 'Copywriting' },
    { value: 'CONSULTING', label: 'Consulting' },
    { value: 'OTHER', label: 'Other' },
];

const SORT_OPTIONS = [
    { value: 'rating', label: 'By Rating' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
];

export default function MarketplaceSection() {
    const navigate = useNavigate();

    // Fetch services using React Query (automatic caching!)
    const { data: services = [], isLoading: loading } = useServices({ limit: 6, type: 'GENERAL' });

    const [filteredServices, setFilteredServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSort, setSelectedSort] = useState('rating');
    const [showFilters, setShowFilters] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

    // Apply filters when dependencies change
    useEffect(() => {
        let filtered = [...services];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (service) =>
                    service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
    }, [searchQuery, selectedCategory, selectedSort, priceRange, services]);

    return (
        <section className="py-16 px-4 bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                            Services <span className="text-[#d62e1f]">Marketplace</span>
                        </h2>
                        <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                            Find professionals for your project
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
                            {CATEGORIES.map((cat) => (
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
                            {SORT_OPTIONS.map((option) => (
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
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Advanced Filters
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
                                            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                                        />
                                        <span className="text-gray-500">—</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
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
                    Found: {filteredServices.length} services
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#2a2a2a] border-t-purple-600"></div>
                    </div>
                ) : (
                    <>
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
                                    No services found
                                </h3>
                                <p className="text-gray-600 dark:text-[#a0a0a0]">
                                    Try adjusting your filter settings
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
