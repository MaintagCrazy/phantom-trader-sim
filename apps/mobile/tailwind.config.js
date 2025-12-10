/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'purple-heart': '#4E44CE',
        'purple-dark': '#3B1E90',
        'purple-light': '#AB9FF2',
        'dark-bg': '#131314',
        'card-bg': '#1C1C1E',
        'shark': '#2C2D30',
        'profit': '#30D158',
        'loss': '#FF453A',
        'teal': '#3DDAD7',
      },
    },
  },
  plugins: [],
};
