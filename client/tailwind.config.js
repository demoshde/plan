/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#1a1f2e',
        'primary-blue': '#2c3e50',
        'accent-gold': '#d4a843',
        'accent-amber': '#f39c12',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
