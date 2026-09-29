/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#F2F9F7",
          100: "#E3F2EF",
          200: "#C4E4DD",
          300: "#98CFC4",
          400: "#62B2A3",
          500: "#399585",
          600: "#267669",
          700: "#1E5E54",
          800: "#164B43",
          900: "#0A3832",
          950: "#062622",
        },
      },
    },
  },
  plugins: [],
};
