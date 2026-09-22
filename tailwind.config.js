/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nudge: {
          blue: '#2E62F6',
          'blue-light': '#507DFE',
          'blue-container': '#EBF1FF',
          'blue-container-dark': '#1E283C',
          cream: '#FAF7F2',
          card: '#FFFFFF',
          'card-dark': '#22201D',
          parchment: '#F4EFE6',
          'parchment-dark': '#2A2723',
          border: '#EDE8DF',
          'border-dark': '#3C3730',
          dark: '#181614',
          'text-primary': '#1C1A17',
          'text-secondary': '#756F67',
          'text-muted': '#A39D93',
          'text-primary-dark': '#EDE8DF',
          'text-secondary-dark': '#9F988D',
          'text-muted-dark': '#756F65',
          sage: '#E2EBE2',
          peach: '#FFFFECE0',
          lavender: '#EDE9F7',
          important: '#FA541C',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'float': '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
