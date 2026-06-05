/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "var(--bg-secondary)",
          elevated: "var(--bg-card)",
          border: "var(--border-color)",
        },
        accent: {
          DEFAULT: "var(--accent-blue)",
        },
        slate: {
          50: "var(--bg-primary)",
          100: "var(--border-color)",
          200: "var(--border-color)",
          300: "var(--text-muted)",
          400: "var(--text-muted)",
          500: "var(--text-muted)",
          600: "var(--text-muted)",
          700: "var(--text-label)",
          800: "var(--text-secondary)",
          900: "var(--text-primary)",
        },
      },
    },
  },
  plugins: [],
};
