import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, Star } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';

// Mock tutoring services
const mockTutors = [
  {
    id: 1,
    type: 'TUTORING',
    title: 'Math Tutoring (Algebra & Calculus)',
    description: 'Experienced math tutor for university students. Flexible schedule, individual approach.',
    category: 'MATH',
    price: 5000,
    priceType: 'HOURLY',
    rating: 5.0,
    reviewCount: 18,
    imageUrl: 'https://via.placeholder.com/400x300?text=Math+Tutoring',
    provider: {
      firstName: 'Алия',
      lastName: 'Нурмуханова',
      faculty: 'Mathematics',
    },
  },
  {
    id: 2,
    type: 'TUTORING',
    title: 'English Language Tutoring',
    description: 'IELTS preparation, academic English, conversation practice',
    category: 'ENGLISH',
    price: 6000,
    priceType: 'HOURLY',
    rating: 4.9,
    reviewCount: 32,
    imageUrl: 'https://via.placeholder.com/400x300?text=English+Tutoring',
    provider: {
      firstName: 'Асем',
      lastName: 'Смагулова',
      faculty: 'Linguistics',
    },
  },
  {
    id: 3,
    type: 'TUTORING',
    title: 'Programming (Python, Java)',
    description: 'Learn programming from scratch or improve your skills. Data structures, algorithms.',
    category: 'PROGRAMMING',
    price: 7000,
    priceType: 'HOURLY',
    rating: 4.8,
    reviewCount: 25,
    imageUrl: 'https://via.placeholder.com/400x300?text=Programming+Tutoring',
    provider: {
      firstName: 'Нуржан',
      lastName: 'Токаев',
      faculty: 'Computer Science',
    },
  },
  {
    id: 4,
    type: 'TUTORING',
    title: 'Physics Tutoring',
    description: 'High school and university physics. Mechanics, electromagnetism, thermodynamics.',
    category: 'PHYSICS',
    price: 5500,
    priceType: 'HOURLY',
    rating: 4.9,
    reviewCount: 15,
    imageUrl: 'https://via.placeholder.com/400x300?text=Physics+Tutoring',
    provider: {
      firstName: 'Данияр',
      lastName: 'Жумабаев',
      faculty: 'Physics',
    },
  },
  {
    id: 5,
    type: 'TUTORING',
    title: 'Chemistry Tutoring',
    description: 'Organic, inorganic, physical chemistry. Exam preparation.',
    category: 'CHEMISTRY',
    price: 5500,
    priceType: 'HOURLY',
    rating: 4.7,
    reviewCount: 12,
    imageUrl: 'https://via.placeholder.com/400x300?text=Chemistry+Tutoring',
    provider: {
      firstName: 'Айгерим',
      lastName: 'Есенова',
      faculty: 'Chemistry',
    },
  },
  {
    id: 6,
    type: 'TUTORING',
    title: 'Economics & Business',
    description: 'Microeconomics, macroeconomics, business fundamentals, financial analysis.',
    category: 'ECONOMICS',
    price: 6500,
    priceType: 'HOURLY',
    rating: 4.8,
    reviewCount: 20,
    imageUrl: 'https://via.placeholder.com/400x300?text=Economics+Tutoring',
    provider: {
      firstName: 'Ержан',
      lastName: 'Кенжебаев',
      faculty: 'Economics',
    },
  },
];

const subjects = [
  { value: 'all', label: 'Все предметы' },
  { value: 'MATH', label: 'Математика' },
  { value: 'ENGLISH', label: 'Английский язык' },
  { value: 'PROGRAMMING', label: 'Программирование' },
  { value: 'PHYSICS', label: 'Физика' },
  { value: 'CHEMISTRY', label: 'Химия' },
  { value: 'BIOLOGY', label: 'Биология' },
  { value: 'ECONOMICS', label: 'Экономика' },
  { value: 'LAW', label: 'Право' },
];

export default function TutoringPage() {
  const [tutors, setTutors] = useState(mockTutors);
  const [filteredTutors, setFilteredTutors] = useState(mockTutors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedSubject, minRating, maxPrice]);

  const applyFilters = () => {
    let filtered = [...tutors];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (tutor) =>
          tutor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tutor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${tutor.provider.firstName} ${tutor.provider.lastName}`
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
    filtered = filtered.filter((tutor) => tutor.price <= maxPrice);

    // Sort by rating (highest first)
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    setFilteredTutors(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Найди репетитора
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Лучшие студенты помогут тебе с учебой
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по предмету или имени репетитора..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-12 pr-4 py-4 rounded-xl
                bg-white dark:bg-gray-800
                border-2 border-gray-200 dark:border-gray-700
                focus:border-purple-500 dark:focus:border-purple-500
                focus:ring-4 focus:ring-purple-500/20
                outline-none transition-all text-lg
              "
            />
          </div>

          {/* Filter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Предмет
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="
                  w-full px-3 py-2 rounded-lg
                  bg-gray-50 dark:bg-gray-700
                  border border-gray-200 dark:border-gray-600
                  focus:border-purple-500 dark:focus:border-purple-500
                  focus:ring-2 focus:ring-purple-500/20
                  outline-none
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Минимальный рейтинг
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
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                  {minRating > 0 ? minRating.toFixed(1) : 'Все'}
                </span>
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Максимальная цена (₸/час)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white w-16">
                  {maxPrice.toLocaleString()}₸
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Найдено репетиторов: <span className="font-semibold">{filteredTutors.length}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Отсортировано по рейтингу
          </div>
        </div>

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <ServiceCard key={tutor.id} service={tutor} />
          ))}
        </div>

        {/* Empty State */}
        {filteredTutors.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Репетиторы не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Попробуйте изменить параметры поиска
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
