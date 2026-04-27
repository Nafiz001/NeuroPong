/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:   '#8B5CF6',
          secondary: '#0EA5E9',
          accent:    '#FBBF24'
        },
        voltari: {
          200: '#DDD6FE',
          300: '#C084FC',
          400: '#A855F7',
          500: '#7C3AED',
          600: '#6D28D9'
        },
        emberlynx: {
          200: '#FFEDD5',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#C2410C'
        },
        bg: {
          0: '#05070D',
          1: '#0B0F1A',
          2: '#11172A'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        body:    ['"Inter Variable"', '"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        'voltari-glow':   '0 0 30px rgba(124, 58, 237, 0.45)',
        'emberlynx-glow': '0 0 30px rgba(249, 115, 22, 0.45)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
