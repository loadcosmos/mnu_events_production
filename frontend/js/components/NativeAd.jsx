import React, { useEffect, useState } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import AdModal from './AdModal';

export default function NativeAd({ ad, onImpression, onClick }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Track impression when ad is rendered
    if (onImpression && ad) {
      onImpression(ad.id);
    }
  }, [ad, onImpression]);

  if (!ad) return null;

  const handleClick = () => {
    if (onClick) {
      onClick(ad.id);
    }
    // Open modal instead of navigating
    setIsModalOpen(true);
  };

  return (
    <div
      onClick={handleClick}
      className="
        group cursor-pointer
        bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-900
        backdrop-blur-xl rounded-2xl overflow-hidden
        border-2 border-[#d62e1f]/30 dark:border-[#d62e1f]/30
        hover:border-[#d62e1f]/50 dark:hover:border-[#d62e1f]/50
        shadow-lg hover:shadow-xl
        transform hover:-translate-y-1
        transition-all duration-300
        relative
      "
    >
      {/* Ad Label */}
      <div className="absolute top-3 right-3 z-10">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#d62e1f]/80 backdrop-blur-sm text-xs text-white">
          <Eye className="w-3 h-3" />
          <span>Реклама</span>
        </div>
      </div>

      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-red-200 to-red-300 dark:from-red-900 dark:to-red-800">
        <img
          src={ad.imageUrl || '/images/backg.jpg'}
          alt={ad.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            console.error('Failed to load native ad image:', ad.imageUrl);
            // Try different fallback paths
            if (e.target.src !== '/images/backg.jpg') {
              e.target.src = '/images/backg.jpg';
            } else if (e.target.src !== '/images/event1.jpg') {
              e.target.src = '/images/event1.jpg';
            } else if (e.target.src !== '/images/event2.jpg') {
              e.target.src = '/images/event2.jpg';
            } else {
              e.target.style.display = 'none';
            }
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#d62e1f] dark:group-hover:text-[#d62e1f] transition-colors">
          {ad.title}
        </h3>

        {ad.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {ad.description}
          </p>
        )}

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="
            w-full px-4 py-2 rounded-lg
            bg-gradient-to-r from-[#d62e1f] to-[#b91c1c]
            hover:from-[#b91c1c] hover:to-[#991b1b]
            text-white font-medium text-sm
            transform hover:scale-105 transition-all
            shadow-md hover:shadow-lg
            flex items-center justify-center gap-2
          "
        >
          <span>Узнать больше</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Sponsored Text */}
      <div className="px-5 pb-3 text-xs text-gray-500 dark:text-gray-500 flex items-center justify-between">
        <span>Спонсируется</span>
        <span className="text-[#d62e1f] dark:text-[#d62e1f]">Продвижение</span>
      </div>

      {/* Ad Modal */}
      <AdModal
        ad={ad}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
