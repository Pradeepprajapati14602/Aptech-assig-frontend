/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#b3d7ff',
          200: '#80bdff',
          300: '#4da3ff',
          400: '#1a89ff',
          500: '#0070e6',
          600: '#0059b3',
          700: '#004280',
          800: '#002b4d',
          900: '#00141a',
        },
        eclipse: {
          light: '#4da3ff',
          DEFAULT: '#0070e6',
          dark: '#004280',
        }
      },
    },
  },
  plugins: [],
}
