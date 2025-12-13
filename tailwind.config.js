/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          roboto: ['Roboto', 'sans-serif'],
        },
        colors: {
          primary: "#ff4747", // 🎯 primary color
        },
        animation: {
          'fade-in-left': 'fadeInLeft 1s ease-out',
        },
        keyframes: {
          fadeInLeft: {
            '0%': { opacity: 0, transform: 'translateX(-50px)' },
            '100%': { opacity: 1, transform: 'translateX(0)' },
          },
        },
      },
    },
    plugins: [],
  };