import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        brand: {
          50: '#edf8ff',
          100: '#d6efff',
          500: '#1677ff',
          600: '#0b63df',
          700: '#0c52b5',
        },
      },
      boxShadow: {
        soft: '0 16px 45px -20px rgba(15, 23, 42, .28)',
      },
    },
  },
  plugins: [],
} satisfies Config;
