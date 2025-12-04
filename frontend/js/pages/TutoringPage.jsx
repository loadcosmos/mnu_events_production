import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, Star } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import servicesService from '../services/servicesService';

const subjects = [
  { value: 'all', label: 'All Subjects' },
  { value: 'MATH', label: 'Mathematics' },
  { value: 'ENGLISH', label: 'English' },
  { value: 'PROGRAMMING', label: 'Programming' },
  { value: 'PHYSICS', label: 'Physics' },
  { value: 'CHEMISTRY', label: 'Chemistry' },
  { value: 'BIOLOGY', label: 'Biology' },
  { value: 'ECONOMICS', label: 'Economics' },
  { value: 'LAW', label: 'Law' },
];

export default function TutoringPage() {
  const [tutors, setTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load tutoring services from API
  useEffect(() => {
    loadTutors();
  }, []);

  const loadTutors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await servicesService.getAll({ type: 'TUTORING' });

      let tutorsData = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          tutorsData = response;
        } else if (Array.isArray(response.data)) {
          tutorsData = response.data;
        } else if (response.services && Array.isArray(response.services)) {
          tutorsData = response.services;
        }
      }

      setTutors(tutorsData);
      setFilteredTutors(tutorsData);
    } catch (err) {
      console.error('[TutoringPage] Load tutors failed:', err);
      setError('Failed to load tutoring services');
      setTutors([]);
      setFilteredTutors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedSubject, minRating, maxPrice, tutors]);

  const applyFilters = () => {
    let filtered = [...tutors];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (tutor) =>
          tutor.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tutor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${tutor.provider?.firstName || ''} ${tutor.provider?.lastName || ''}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter((tutor) => tutor.category === selectedSubject);
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter((tutor) => (tutor.rating || 0) >= minRating);
    }

    // Price filter
    filtered = filtered.filter((tutor) => (tutor.price || 0) <= maxPrice);

    // Sort by rating (highest first)
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    setFilteredTutors(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            Find a Tutor
          </h1>
          <p className="text-lg text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
            Best students will help you with your studies
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#a0a0a0]" />
            <input
              type="text"
              placeholder="Search by subject or tutor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-12 pr-4 py-4 rounded-xl
                bg-white dark:bg-[#1a1a1a]
                border-2 border-gray-200 dark:border-[#2a2a2a]
                focus:border-[#d62e1f] dark:focus:border-[#d62e1f]
                focus:ring-4 focus:ring-[#d62e1f]/20
                outline-none transition-all text-lg
                text-gray-900 dark:text-white
                placeholder:text-gray-500 dark:placeholder:text-[#666666]
              "
            />
          </div>

          {/* Filter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject Filter */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <label className="block text-sm font-medium text-gray-700 dark:text-[#a0a0a0] mb-2 transition-colors duration-300">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="
                  w-full px-3 py-2 rounded-lg
                  bg-gray-50 dark:bg-[#0a0a0a]
                  border border-gray-200 dark:border-[#2a2a2a]
                  focus:border-[#d62e1f] dark:focus:border-[#d62e1f]
                  focus:ring-2 focus:ring-[#d62e1f]/20
                  outline-none
                  text-gray-900 dark:text-white
                  transition-colors duration-300
                "
              >
                {subjects.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <label className="block text-sm font-medium text-gray-700 dark:text-[#a0a0a0] mb-2 transition-colors duration-300">
                Minimum Rating
              </label>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="flex-1 accent-[#d62e1f]"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white w-8 transition-colors duration-300">
                  {minRating > 0 ? minRating.toFixed(1) : 'All'}
                </span>
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <label className="block text-sm font-medium text-gray-700 dark:text-[#a0a0a0] mb-2 transition-colors duration-300">
                Maximum Price (₸/hour)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="flex-1 accent-[#d62e1f]"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white w-16 transition-colors duration-300">
                  {maxPrice.toLocaleString()}₸
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
            Tutors found: <span className="font-semibold text-gray-900 dark:text-white">{filteredTutors.length}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-[#666666] transition-colors duration-300">
            Sorted by rating
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-[#2a2a2a] border-t-[#d62e1f]"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
            <GraduationCap className="w-16 h-16 mx-auto text-gray-400 dark:text-[#666666] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              {error}
            </h3>
            <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
              Please try again later
            </p>
          </div>
        )}

        {/* Tutors Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => (
              <ServiceCard key={tutor.id} service={tutor} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTutors.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
            <GraduationCap className="w-16 h-16 mx-auto text-gray-400 dark:text-[#666666] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              No tutors found
            </h3>
            <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
              Try adjusting your search parameters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
