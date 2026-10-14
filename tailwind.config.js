/** @type {import('tailwindcss').Config} */
// DealHunter in the logo's colours: deep pine ink, teal for the good price and the action, a cool
// off-white ground. One shape runs the system: the logo's price tag with its cut corner (.cut).
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
        chalk: { DEFAULT: "#F7FAF9", dim: "#C9D3CE" },
        warn: { soft: "#FCEFD3", ink: "#6A4A0C" },
        // alert red: a rise, an error, a destructive action
        marker: { DEFAULT: "#E5484D", deep: "#B8343A" },
        paper: "#F3F6F5",
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
        // the signature: the stage opens from its cut corner, the fragment settles
        shutter: {
          from: { clipPath: "inset(0 0 100% 100%)" },
          to: { clipPath: "inset(0 0 0 0)" },
        },
        settle: {
          from: { transform: "scale(1.06)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "draw-line": {
          from: { strokeDashoffset: "1" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "line-rise": "line-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both",
        "rise-in": "rise-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        shutter: "shutter 1.1s cubic-bezier(0.77, 0, 0.18, 1) both",
        settle: "settle 1.1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "draw-line": "draw-line 1.6s cubic-bezier(0.65, 0, 0.35, 1) both",
      },
    },
  },
  plugins: [],
};
