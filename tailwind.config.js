/** @type {import('tailwindcss').Config} */
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
        // Brand: the logo's deep pine + teal
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
        // The logo's bright teal, for highlights on dark surfaces
        teal: {
          300: "#7EE8CF",
          400: "#3CCFB0",
          500: "#1A9988",
        },
        // Warm accent, used sparingly (a good price, a free badge)
        honey: {
          100: "#FFF1D6",
          300: "#FFD27A",
          400: "#FFC24D",
          500: "#F5A524",
        },
      },
      keyframes: {
        "draw-line": {
          from: { strokeDashoffset: "var(--dash, 600)" },
          to: { strokeDashoffset: "0" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "draw-line": "draw-line 2.4s cubic-bezier(0.65, 0, 0.35, 1) forwards",
        "float-y": "float-y 6s ease-in-out infinite",
        "rise-in": "rise-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
