/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Forest-green accent
        forest: {
          50: '#f0f7f2',
          100: '#dcecdf',
          600: '#1f7a43',
          700: '#176336',
          800: '#124f2c',
        },
        // Amber for incomplete / needs-attention items
        warn: {
          50: '#fff8eb',
          100: '#fdecc8',
          600: '#b45309',
          700: '#92400e',
        },
        // Red for urgent items
        urgent: {
          50: '#fef2f2',
          100: '#fee2e2',
          600: '#b91c1c',
          700: '#991b1b',
        },
      },
    },
  },
  plugins: [],
}
