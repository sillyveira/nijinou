/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#ff4d67', // vermelho claro
          DEFAULT: '#b8001c', // vermelho escuro
          dark: '#2a0006', // quase preto
        },
        secondary: '#111111', // preto
        accent: '#fff', // branco para contraste
      },
    },
  },
  plugins: [],
};
