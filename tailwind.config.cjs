const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#F14D8A',
          pinkDark: '#D81B60',
          pinkSoft: '#F8A5C2',
        },
        surface: {
          muted: '#F0F0F0',
          subtle: '#E4E4E4',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        pdf: '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [require('tailwind-scrollbar')],
}