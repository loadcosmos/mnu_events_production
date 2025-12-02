import React from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function AdModal({ ad, isOpen, onClose }) {
  if (!isOpen || !ad) return null;

  const handleExternalClick = () => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 liquid-glass-overlay" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-2xl liquid-glass-strong rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 liquid-glass-button text-white p-2 rounded-full hover:scale-110 transition-all"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Section */}
        <div className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800">
          <img
            src={ad.imageUrl || '/images/backg.jpg'}
            alt={ad.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Ad Label */}
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#d62e1f]/80 backdrop-blur-sm text-xs text-white font-medium">
              <span>Реклама</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {ad.title}
          </h2>

          {ad.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              {ad.description}
            </p>
          )}

          {/* CTA Button */}
          {ad.linkUrl && (
            <button
              onClick={handleExternalClick}
              className="
                w-full px-6 py-4 rounded-xl
                liquid-glass-red-button
                text-white font-bold text-lg
                transform hover:scale-105 transition-all duration-300
                shadow-lg hover:shadow-xl
                flex items-center justify-center gap-3
              "
            >
              <span>Узнать больше</span>
              <ExternalLink className="w-5 h-5" />
            </button>
          )}

          {/* Sponsored Text */}
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
            <span>Спонсируется</span>
          </div>
        </div>
      </div>
    </div>
  );
}

