/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#1a2332',
          700: '#334155',
          500: '#64748b',
        },
        mist: {
          50: '#f4f7fb',
          100: '#e8eef6',
          200: '#d5e0ec',
        },
        gold: {
          300: '#e8c86a',
          400: '#d4a84b',
          500: '#b8860b',
          600: '#9a6f0a',
        },
        moss: {
          400: '#4caf73',
          500: '#2f9e5a',
          600: '#217a44',
          700: '#1f5a38',
        },
        blood: {
          400: '#e07070',
          500: '#d14343',
          600: '#b33333',
          700: '#7a2222',
        },
        // keep night aliases mapped to light surfaces so old classes don't go black
        night: {
          950: '#f4f7fb',
          900: '#ffffff',
          800: '#e8eef6',
          700: '#d5e0ec',
        },
        parchment: '#1a2332',
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 28px rgba(26, 35, 50, 0.08)',
        glow: '0 8px 24px rgba(184, 134, 11, 0.25)',
        'glow-evil': '0 8px 24px rgba(209, 67, 67, 0.25)',
        'glow-good': '0 8px 24px rgba(47, 158, 90, 0.25)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '100%': { transform: 'scale(1.25)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        pulseRing: 'pulseRing 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
}
