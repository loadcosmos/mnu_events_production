import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

const adSizes = {
  TOP_BANNER: 'h-[100px] md:h-[200px]',
  BOTTOM_BANNER: 'h-[100px] md:h-[200px]',
  NATIVE_FEED: 'h-[100px] md:h-[200px]',
  HERO_SLIDE: 'h-[300px] md:h-[400px]',
};

export default function AdBanner({
  ad,
  position = 'TOP_BANNER',
  onImpression,
  onClick,
}) {
  useEffect(() => {
    // Track impression when ad is rendered
    if (onImpression && ad) {
      onImpression(ad.id);
    }
  }, [ad, onImpression]);

  if (!ad) return null;

  const handleClick = () => {
    // Track click if handler provided
    if (onClick) {
      onClick(ad.id);
    }
    // Direct navigation to external URL
    const url = ad.externalUrl || ad.linkUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('Ad has no external URL:', ad);
    }
  };

  const sizeClass = adSizes[position] || adSizes.TOP_BANNER;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 my-4">
      <div
        className={`
          max-w-7xl mx-auto rounded-2xl
          overflow-hidden
          liquid-glass-card
          ${sizeClass}
          cursor-pointer hover:scale-[1.01] transition-all duration-300
          relative group
          border border-gray-200 dark:border-[#2a2a2a]
          shadow-lg hover:shadow-2xl
        `}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
      >
        {/* Ad Image */}
        <img
          src={ad.imageUrl || '/images/backg.jpg'}
          alt={ad.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            console.error('Failed to load ad image:', ad.imageUrl);
            // Try different fallback paths
            if (e.target.src !== '/images/backg.jpg') {
              e.target.src = '/images/backg.jpg';
            } else if (e.target.src !== '/images/event1.jpg') {
              e.target.src = '/images/event1.jpg';
            } else {
              e.target.style.display = 'none';
              e.target.parentElement.classList.add('bg-gradient-to-br', 'from-red-200', 'to-red-300');
            }
          }}
        />

        {/* Ad Label */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
          Реклама
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}
