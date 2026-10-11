import type { Config } from 'tailwindcss';

// The BudgetTracker palette: deep forest "ink", a fresh leaf green, warm paper background,
// with coral for money going out, sunflower for warnings and a calm blue for savings.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0f2a24', soft: '#35514a', muted: '#6b7f78' },
        leaf: {
          50: '#ecfbf3', 100: '#d3f5e2', 200: '#a9ead0', 300: '#74d9b3', 400: '#3fc294',
          500: '#1fa87a', 600: '#148863', 700: '#126d51', 800: '#115742', 900: '#0f2a24',
        },
        paper: { DEFAULT: '#f6f4ec', deep: '#ece9dd' },
        line: '#e4e0d2',
        coral: { 50: '#fff1ee', 100: '#ffe0d9', 500: '#e8553d', 600: '#cf4128' },
        sun: { 50: '#fff8e6', 100: '#feefc2', 500: '#f2b035', 600: '#d9961a' },
        sky: { 50: '#eef3ff', 100: '#dce6ff', 500: '#3b6fd8', 600: '#2c58b8' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        card: '0 1px 2px rgba(15,42,36,.04), 0 8px 24px -12px rgba(15,42,36,.12)',
        pop: '0 24px 60px -20px rgba(15,42,36,.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
