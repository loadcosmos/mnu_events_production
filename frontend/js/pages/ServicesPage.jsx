import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Plus, Megaphone } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import { Button } from '../components/ui/button';

// Mock data - will be replaced with API calls
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

export default function ServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState(mockServices);
  const [filteredServices, setFilteredServices] = useState(mockServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  useEffect(() => {
    applyFilters();
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Marketplace услуг
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
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
              className="rounded-xl"
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
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                focus:border-purple-500 dark:focus:border-purple-500
                focus:ring-2 focus:ring-purple-500/20
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
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                focus:border-purple-500 dark:focus:border-purple-500
                focus:ring-2 focus:ring-purple-500/20
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
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                focus:border-purple-500 dark:focus:border-purple-500
                focus:ring-2 focus:ring-purple-500/20
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
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Фильтры
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    />
                    <span className="text-gray-500">—</span>
                    <input
                      type="number"
                      placeholder="Макс"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 100000 })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
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
            <p className="text-gray-600 dark:text-gray-400">
              Попробуйте изменить параметры фильтрации
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
