/** @type {import('tailwindcss').Config} */
// The market price board, in the logo's colours: pine board, chalk ink, kraft price tags,
// red marker for struck prices, teal chalk for the good price and the action. Flat, square-cut.
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        marker: ["var(--font-marker)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        // Logo deep pine, the board
        pine: {
          50: "#EEF5F3",
          100: "#DCEBE7",
          200: "#B6D6CE",
          300: "#86BBAE",
          400: "#4F9989",
          500: "#2C7A6B",
          600: "#1F6156",
          700: "#174C44",
          800: "#0F4039",
          900: "#0A3832",
          950: "#062622",
        },
        // Logo teal, chalk for the good price and the action
        teal: {
          200: "#BFF3E6",
          300: "#7EE8CF",
          400: "#3CCFB0",
          500: "#1A9988",
          600: "#137A6C",
        },
        chalk: { DEFAULT: "#F1F0EA", dim: "#C9D3CE" },
        kraft: { light: "#E2C08B", DEFAULT: "#D2A86A", deep: "#A97E43", ink: "#2A1C0B" },
        marker: { DEFAULT: "#D9412B", deep: "#B3301D" },
        paper: "#F3F2EE",
      },
      keyframes: {
        "line-rise": {
          from: { transform: "translateY(105%)" },
          to: { transform: "translateY(0)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "strike-draw": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "slow-drift": {
          from: { transform: "scale(1.04) translateX(0)" },
          to: { transform: "scale(1.1) translateX(-2%)" },
        },
      },
      animation: {
        "line-rise": "line-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both",
        "rise-in": "rise-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "strike-draw": "strike-draw 0.5s cubic-bezier(0.65, 0, 0.35, 1) both",
        "slow-drift": "slow-drift 18s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
