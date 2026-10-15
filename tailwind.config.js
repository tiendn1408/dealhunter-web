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
      boxShadow: {
        // soft, diffused depth in the pine hue (never grey/black drop shadows)
        soft: "0 1px 2px rgba(10,56,50,0.05), 0 18px 48px -18px rgba(10,56,50,0.22)",
        float: "0 2px 6px rgba(10,56,50,0.06), 0 40px 80px -28px rgba(10,56,50,0.35)",
        glow: "0 0 0 1px rgba(60,207,176,0.25), 0 24px 70px -20px rgba(60,207,176,0.55)",
        inner: "inset 0 1px 1px rgba(255,255,255,0.7)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
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
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-14px) scale(0.97)" },
          "12%, 78%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "92%, 100%": { opacity: "0", transform: "translateY(-6px) scale(0.98)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "line-rise": "line-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both",
        "rise-in": "rise-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        shutter: "shutter 1.1s cubic-bezier(0.77, 0, 0.18, 1) both",
        settle: "settle 1.1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "draw-line": "draw-line 1.6s cubic-bezier(0.65, 0, 0.35, 1) both",
        "toast-in": "toast-in 6s cubic-bezier(0.32, 0.72, 0, 1) infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};
