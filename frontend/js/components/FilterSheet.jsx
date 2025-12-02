import React, { useEffect } from 'react';

/**
 * Bottom Sheet for advanced filters on mobile
 * Slides up from bottom with filter options
 */
const FilterSheet = ({ isOpen, onClose, children, title = 'Filters' }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 liquid-glass-overlay z-40 md:hidden transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet with Liquid Glass Effect */}
      <div
        className="fixed bottom-0 left-0 right-0 liquid-glass-strong rounded-t-2xl z-50 md:hidden max-h-[80vh] overflow-y-auto shadow-2xl transition-colors duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded-full transition-colors duration-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
          <h2 id="filter-sheet-title" className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-[#a0a0a0] hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Close filters"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pb-safe">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 liquid-glass-strong border-t-0 p-4 pb-safe transition-colors duration-300">
          <button
            onClick={onClose}
            className="w-full liquid-glass-red-button text-white font-semibold py-3 px-6 rounded-2xl shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterSheet;
