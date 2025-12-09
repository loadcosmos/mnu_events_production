import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Briefcase, Building2, TrendingUp, PieChart, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MorePage() {
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Community',
      description: 'Campus feed, announcements, and discussions',
      icon: <Users className="w-10 h-10" />,
      path: '/community',
      color: 'from-red-500 to-orange-500',
      available: true,
    },
    {
      title: 'Tutoring',
      description: 'Find a tutor or offer your services',
      icon: <GraduationCap className="w-10 h-10" />,
      path: '/tutoring',
      color: 'from-blue-500 to-cyan-500',
      available: true,
    },
    {
      title: 'Services',
      description: 'Offer or find various student services',
      icon: <Briefcase className="w-10 h-10" />,
      path: '/marketplace',
      color: 'from-purple-500 to-pink-500',
      available: true,
    },
    {
      title: 'CSI Statistics',
      description: 'View your CSI activity progress and statistics',
      icon: <PieChart className="w-10 h-10" />,
      path: '/csi-dashboard',
      color: 'from-emerald-500 to-teal-500',
      available: true,
      studentOnly: true,
    },
    {
      title: 'Preparation',
      description: 'Exam preparation and room rental',
      icon: <Building2 className="w-10 h-10" />,
      path: '/preparation',
      color: 'from-green-500 to-emerald-500',
      available: false,
    },
    {
      title: 'Analytics',
      description: 'Attendance statistics and analytics',
      icon: <TrendingUp className="w-10 h-10" />,
      path: '/analytics',
      color: 'from-orange-500 to-red-500',
      available: false,
    },
  ];

  // Filter items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (item.studentOnly && user?.role !== 'STUDENT') {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            More <span className="text-[#d62e1f]">Features</span>
          </h1>
          <p className="text-gray-600 dark:text-[#a0a0a0]">
            Explore all MNU Events platform features
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMenuItems.map((item, index) => {
            const CardComponent = item.available ? Link : 'div';
            const cardProps = item.available
              ? { to: item.path }
              : {};

            return (
              <CardComponent
                key={index}
                {...cardProps}
                className={`
                  relative overflow-hidden rounded-2xl p-6
                  liquid-glass-strong
                  transition-all duration-300
                  ${item.available
                    ? 'hover:scale-105 hover:shadow-xl cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                  }
                `}
              >
                {/* Gradient Background Overlay */}
                <div
                  className={`
                    absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-20
                    bg-gradient-to-br ${item.color} blur-2xl
                  `}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`
                      inline-flex p-3 rounded-xl mb-4
                      bg-gradient-to-br ${item.color}
                      text-white
                    `}
                  >
                    {item.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {item.title}
                    {!item.available && (
                      <span className="ml-2 text-xs font-normal px-2 py-1 rounded-full bg-gray-200 dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a0a0a0]">
                        Coming soon
                      </span>
                    )}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">
                    {item.description}
                  </p>

                  {/* Arrow Icon for available items */}
                  {item.available && (
                    <div className="mt-4 flex items-center text-[#d62e1f] font-semibold text-sm">
                      Open
                      <i className="fa-solid fa-arrow-right ml-2 text-xs" />
                    </div>
                  )}
                </div>
              </CardComponent>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 rounded-2xl liquid-glass-strong">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Have ideas?
              </h4>
              <p className="text-gray-600 dark:text-[#a0a0a0] text-sm mb-3">
                We are constantly working on improving the platform. If you have suggestions for new features, contact us!
              </p>
              <a
                href="mailto:support@mnu.edu.kz"
                className="inline-flex items-center gap-2 text-[#d62e1f] hover:text-[#ff4433] font-semibold text-sm transition-colors"
              >
                <i className="fa-solid fa-envelope" />
                Contact us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
