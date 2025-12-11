/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5F1E8',
        brown: {
          light: '#D4A574',
          DEFAULT: '#8B4513',
          dark: '#5C2E0A',
        },
        purple: {
          light: '#B19CD9',
          DEFAULT: '#6B46C1',
          dark: '#4C1D95',
        },
      },
      fontFamily: {
        'indian': ['"Noto Sans Devanagari"', '"Mukta"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

