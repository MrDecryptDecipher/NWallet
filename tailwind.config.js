/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8E44AD',    // Purpureus (purple)
        secondary: '#E74C3C',  // Carmine Pink
        background: '#1A1B27', // Dark background
        text: '#F5F5F7',       // Light text
        darkbg: '#1a1a1d', // Dark background
      },
      backgroundImage: {
        'gradient-cosmic': 'radial-gradient(circle at top, rgba(225,0,255,0.3), rgba(127,0,255,0.8))',
      },
    },
  },
    darkMode: 'class',
  plugins: [],
};
