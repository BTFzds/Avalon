/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#070b12',
          900: '#0c1420',
          800: '#132033',
          700: '#1a2d45',
        },
        gold: {
          300: '#e8c86a',
          400: '#d4a84b',
          500: '#c4922e',
        },
        moss: {
          400: '#6fbf8a',
          500: '#3d8f5c',
          700: '#1f5a38',
        },
        blood: {
          400: '#e07070',
          500: '#c44545',
          700: '#7a2222',
        },
        parchment: '#e9dfc5',
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(212, 168, 75, 0.35)',
        'glow-evil': '0 0 40px rgba(196, 69, 69, 0.4)',
        'glow-good': '0 0 40px rgba(111, 191, 138, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        pulseRing: 'pulseRing 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
}
