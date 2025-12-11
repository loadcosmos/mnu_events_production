import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
    { code: 'kz', label: 'KZ' }
  ];

  const currentIndex = languages.findIndex(lang => lang.code === i18n.language);

  return (
    <div className="relative inline-flex bg-gray-100 dark:bg-[#1a1a1a] rounded-full p-0.5 border border-gray-200 dark:border-[#2a2a2a]">
      {/* Animated sliding background */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-full bg-white dark:bg-[#2a2a2a] shadow-sm transition-all duration-300 ease-out"
        style={{
          left: `${currentIndex * (100 / languages.length)}%`,
          width: `${100 / languages.length}%`,
          transform: 'translateX(2px) scaleX(0.96)'
        }}
      />

      {/* Language buttons */}
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`
            relative z-10 px-3 py-1.5 min-w-[44px] rounded-full text-xs font-bold tracking-wide transition-all duration-300
            ${i18n.language === lang.code
              ? 'text-[#d62e1f]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }
          `}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
