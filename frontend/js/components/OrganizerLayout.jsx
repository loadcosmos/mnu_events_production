import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

/**
 * Административный Layout для организатора
 * Sidebar слева, минималистичный дизайн: красный, белый, черный
 */
export default function OrganizerLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('ENG');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const langDropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    };

    if (langOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langOpen]);

  const navItems = [
    { path: '/organizer', label: 'Dashboard', icon: '📊' },
    { path: '/organizer/create-event', label: 'Create Event', icon: '➕' },
    { path: '/organizer/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex transition-colors duration-300">
      {/* Left Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 liquid-glass-strong text-white transition-all duration-300 z-40 m-4 rounded-3xl h-[calc(100vh-2rem)]",
        sidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 border-b border-white/10 flex items-center px-4 rounded-2xl">
            {sidebarOpen ? (
              <Link to="/organizer" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-2xl flex items-center justify-center text-white font-bold">
                  M
                </div>
                <span className="font-bold text-lg">Organizer</span>
              </Link>
            ) : (
              <Link to="/organizer" className="flex items-center justify-center w-full">
                <div className="w-8 h-8 bg-red-600 rounded-2xl flex items-center justify-center text-white font-bold">
                  M
                </div>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-2xl transition-colors",
                        isActive
                          ? "liquid-glass-red-button text-white"
                          : "text-gray-300 hover:bg-white/10"
                      )}
                    >
                      <span className="text-xl mr-3">{item.icon}</span>
                      {sidebarOpen && <span className="font-medium">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="border-t border-white/10 p-4">
            {sidebarOpen ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.firstName || user?.email}
                    </p>
                    <p className="text-xs text-gray-400 truncate">Organizer</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  className="w-full liquid-glass-red-button rounded-2xl text-white"
                  size="sm"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                </div>
                <Button
                  onClick={handleLogout}
                  className="w-full liquid-glass-red-button rounded-2xl text-white"
                  size="sm"
                  title="Logout"
                >
                  ⬅
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "ml-[272px]" : "ml-[88px]"
      )}>
        {/* Top Header */}
        <header className="h-16 liquid-glass-strong flex items-center justify-between px-6 sticky top-0 z-30 mx-4 mt-4 rounded-2xl">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200/50 dark:hover:bg-white/10"
            >
              {sidebarOpen ? '☰' : '☰'}
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language selector */}
            <div className="relative" ref={langDropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLangOpen(!langOpen)}
                className="text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200/50 dark:hover:bg-white/10"
              >
                {selectedLang}
                <i className="fa-solid fa-chevron-down text-xs ml-1" />
              </Button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-2xl liquid-glass-strong p-1 shadow-lg z-50">
                  {['ENG', 'РУС', 'ҚАЗ'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSelectedLang(lang);
                        setLangOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded-xl transition-colors",
                        selectedLang === lang
                          ? "liquid-glass-red-button text-white"
                          : "hover:bg-gray-200/50 dark:hover:bg-white/10 text-gray-900 dark:text-white"
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="bg-gray-50 dark:bg-[#0a0a0a] min-h-[calc(100vh-6rem)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
