/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'aim-blue': '#1D2B53',
        'aim-light-blue': '#5D8BF4',
        'aim-yellow': '#F2CD5C',
        'aim-orange': '#F24C3D',
        'aim-green': '#2E8B57',
        'aim-gray': '#D9D9D9',
        'aim-dark-gray': '#6B7280',
      },
      fontFamily: {
        'sans': ['Arial', 'Helvetica', 'sans-serif'],
      },
      boxShadow: {
        'aim': '4px 4px 0px 0px rgba(0,0,0,0.8)',
        'aim-sm': '2px 2px 0px 0px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [],
}
