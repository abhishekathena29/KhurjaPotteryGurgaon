/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FBF7F0',
        sand: '#F0E6D3',
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
        gold: {
          light: '#F6E5A3',
          DEFAULT: '#D4A034',
          dark: '#B8860B',
        },
        terracotta: {
          light: '#E8A87C',
          DEFAULT: '#C96B3C',
          dark: '#A0522D',
        },
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'body': ['"Inter"', '"Mukta"', 'sans-serif'],
        'indian': ['"Mukta"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-warm': 'linear-gradient(135deg, #D4A574 0%, #8B4513 50%, #5C2E0A 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F6E5A3 0%, #D4A034 50%, #B8860B 100%)',
      },
      boxShadow: {
        'warm': '0 4px 20px rgba(139, 69, 19, 0.15)',
        'warm-lg': '0 8px 40px rgba(139, 69, 19, 0.2)',
        'gold': '0 4px 20px rgba(212, 160, 52, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
