/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          deep: '#0A0E1A',
          card: '#141829',
          elevated: '#1E2438',
          border: '#2A3050',
        },
        venue: {
          blue: '#2563EB',
          'blue-light': '#3B82F6',
        },
      },
      boxShadow: {
        panel: '0 20px 50px rgba(3, 7, 18, 0.45)',
        critical: '0 0 0 1px rgba(239, 68, 68, 0.35), 0 0 28px rgba(239, 68, 68, 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        ops: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-in-out',
      },
    },
  },
  plugins: [],
};
