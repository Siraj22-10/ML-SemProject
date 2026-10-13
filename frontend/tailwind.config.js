/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'yt-black': '#0f0f0f',
        'yt-dark': '#1f1f1f',
        'yt-card': '#272727',
        'yt-red': '#FF0000',
        'yt-text': '#f1f1f1',
        'yt-muted': '#aaaaaa',
        'yt-hover': '#3f3f3f',
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
