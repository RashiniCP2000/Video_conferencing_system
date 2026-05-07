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
          DEFAULT: "#ffffff",
          elevated: "#f8fafc",
          border: "#e2e8f0",
        },
        accent: "#2563eb",
      },
    },
  },
  plugins: [],
};
