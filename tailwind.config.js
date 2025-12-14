/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'glace-wine': '#751215',  // Vinho (Logo)
        'glace-gold': '#D4AF37',  // Dourado
        'glace-cream': '#F9F5F0', // Fundo Creme
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'pattern-overlay': "linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(255,255,255,0.95))",
      }
    },
  },
  plugins: [],
}