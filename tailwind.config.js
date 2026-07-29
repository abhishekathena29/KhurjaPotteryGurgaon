/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAFAFA',
        sand: '#F5F5F5',
        brown: {
          light: '#57534E',
          DEFAULT: '#292524',
          dark: '#1C1917',
        },
        purple: {
          light: '#C2C5B9',
          DEFAULT: '#9A9F8E',
          dark: '#676C5C',
        },
        gold: {
          light: '#E2D9CD',
          DEFAULT: '#C4B5A5',
          dark: '#9E8D79',
        },
        terracotta: {
          light: '#E1A792',
          DEFAULT: '#C16A46',
          dark: '#8B4228',
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
        'gradient-warm': 'linear-gradient(135deg, #57534E 0%, #292524 100%)',
        'gradient-gold': 'linear-gradient(135deg, #E2D9CD 0%, #C4B5A5 100%)',
      },
      boxShadow: {
        'warm': '0 4px 14px rgba(0, 0, 0, 0.03)',
        'warm-lg': '0 10px 30px rgba(0, 0, 0, 0.05)',
        'gold': '0 4px 14px rgba(0, 0, 0, 0.02)',
        'glass': '0 4px 20px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
