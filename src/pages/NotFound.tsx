import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const NotFound: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDarkMode 
        ? 'bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900' 
        : 'bg-gradient-to-br from-purple-200 via-slate-100 to-pink-200'
    }`}>
      <div className="text-center">
        <h1 className={`text-6xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>
          404
        </h1>
        <p className={`text-xl mb-8 ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>
          Page not found
        </p>
        <Link
          to="/"
          className={`px-6 py-3 rounded-lg transition ${
            isDarkMode 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 