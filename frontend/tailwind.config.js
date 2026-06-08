/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1D9E75', dark: '#0F6E56', light: '#E1F5EE' },
        danger:  { DEFAULT: '#E24B4A', light: '#FCEBEB' },
        warning: { DEFAULT: '#BA7517', light: '#FAEEDA' },
      },
    },
  },
  plugins: [],
}
