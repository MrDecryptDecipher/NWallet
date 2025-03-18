import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {} // Empty function as placeholder
});

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  
  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      // Check localStorage first
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
        return;
      }
      
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch (error) {
      console.warn('Error initializing theme:', error);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    try {
      // Update localStorage when theme changes
      localStorage.setItem('theme', theme);
      
      // Update document class for theme
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      
      // Set theme-specific text color on body
      if (theme === 'dark') {
        document.body.classList.add('text-white');
        document.body.classList.remove('text-slate-800');
      } else {
        document.body.classList.add('text-slate-800');
        document.body.classList.remove('text-white');
      }
    } catch (error) {
      console.warn('Error applying theme:', error);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => {
        try {
          mediaQuery.removeEventListener('change', handleChange);
        } catch (error) {
          console.warn('Error removing media query listener:', error);
        }
      };
    } catch (error) {
      console.warn('Error setting up media query listener:', error);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const contextValue = {
    theme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className="content-container">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};