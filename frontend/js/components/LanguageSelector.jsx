import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
    { code: 'kz', label: 'KZ', flag: '🇰🇿' }
  ];

  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg p-1">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${i18n.language === lang.code
              ? 'bg-[#d62e1f] text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
            }`}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  );
}
