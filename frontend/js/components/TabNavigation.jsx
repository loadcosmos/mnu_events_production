import React, { useState } from 'react';
import { Briefcase, GraduationCap, MoreHorizontal, Calendar, Users } from 'lucide-react';

const tabs = [
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'clubs', label: 'Clubs', icon: Users },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'tutoring', label: 'Tutoring', icon: GraduationCap },
  { id: 'more', label: 'More', icon: MoreHorizontal, dropdown: true },
];

export default function TabNavigation({ activeTab, onTabChange }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleTabClick = (tabId) => {
    if (tabId === 'more') {
      setShowDropdown(!showDropdown);
    } else {
      setShowDropdown(false);
      onTabChange(tabId);
    }
  };

  return (
    <div className="liquid-glass-overlay border-b border-[#d62e1f]/20 dark:border-[#d62e1f]/30">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap
                  rounded-xl transition-all duration-300
                  ${isActive
                    ? 'liquid-glass-red-button text-white shadow-lg'
                    : 'liquid-glass-button text-gray-700 dark:text-gray-300 hover:text-[#d62e1f] dark:hover:text-[#d62e1f]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dropdown for "More" tab (future features) */}
        {showDropdown && (
          <div className="absolute right-4 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
            <div className="py-2">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Coming soon...
              </button>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
