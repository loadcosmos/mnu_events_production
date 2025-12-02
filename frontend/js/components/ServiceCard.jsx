import React from 'react';
import { Star, Clock, DollarSign, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const priceTypeLabels = {
  HOURLY: 'за час',
  FIXED: 'фиксированная',
  PER_SESSION: 'за занятие',
};

const categoryColors = {
  DESIGN: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  PHOTO_VIDEO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  IT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COPYWRITING: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CONSULTING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  MATH: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ENGLISH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PROGRAMMING: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function ServiceCard({ service }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/services/${service.id}`);
  };

  const categoryColor = categoryColors[service.category] || categoryColors.OTHER;

  return (
    <div
      onClick={handleClick}
      className="
        group cursor-pointer
        bg-white/80 dark:bg-gray-800/80
        backdrop-blur-xl rounded-2xl overflow-hidden
        border border-gray-200/50 dark:border-gray-700/50
        hover:border-[#d62e1f]/50 dark:hover:border-[#d62e1f]/50
        shadow-lg hover:shadow-xl
        transform hover:-translate-y-1
        transition-all duration-300
      "
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-red-100 to-red-200 dark:from-gray-700 dark:to-gray-800">
        <img
          src={service.imageUrl || '/images/backg.jpg'}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            console.error('Failed to load service image:', service.imageUrl);
            // Try different fallback paths
            if (e.target.src !== '/images/backg.jpg') {
              e.target.src = '/images/backg.jpg';
            } else if (e.target.src !== '/images/service.jpg') {
              e.target.src = '/images/service.jpg';
            } else if (e.target.src !== '/images/event1.jpg') {
              e.target.src = '/images/event1.jpg';
            } else {
              e.target.style.display = 'none';
            }
          }}
        />

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
            {service.category}
          </span>
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300">
            {service.type === 'TUTORING' ? 'Репетиторство' : 'Услуга'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-[#d62e1f] dark:group-hover:text-[#d62e1f] transition-colors">
          {service.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {service.description}
        </p>

        {/* Provider Info */}
        {service.provider && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span>
              {service.provider.firstName} {service.provider.lastName}
            </span>
            {service.provider.faculty && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                • {service.provider.faculty}
              </span>
            )}
          </div>
        )}

        {/* Rating and Price Row */}
        <div className="flex items-center justify-between">
          {/* Rating */}
          <div className="flex items-center gap-1">
            {service.rating ? (
              <>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {service.rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  ({service.reviewCount})
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-500">Нет отзывов</span>
            )}
          </div>

          {/* Price */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-lg font-bold text-[#d62e1f] dark:text-[#d62e1f]">
              <DollarSign className="w-4 h-4" />
              <span>{service.price.toLocaleString()}₸</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {priceTypeLabels[service.priceType]}
            </span>
          </div>
        </div>

        {/* Order Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="
            w-full mt-4 px-4 py-2 rounded-lg
            bg-gradient-to-r from-[#d62e1f] to-[#b91c1c]
            hover:from-[#b91c1c] hover:to-[#991b1b]
            text-white font-medium text-sm
            transform hover:scale-105 transition-all
            shadow-md hover:shadow-lg
          "
        >
          Заказать
        </button>
      </div>
    </div>
  );
}
