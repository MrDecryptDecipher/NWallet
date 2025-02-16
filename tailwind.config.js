/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7f00ff', // Bright purple
        secondary: '#e100ff', // Vibrant pink
        darkbg: '#1a1a1d', // Dark background
      },
      backgroundImage: {
        'gradient-cosmic': 'radial-gradient(circle at top, rgba(225,0,255,0.3), rgba(127,0,255,0.8))',
      },
    },
  },
  plugins: [],
};
