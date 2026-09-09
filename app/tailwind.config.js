/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        robomost: {
          50: "#eefcfb",
          100: "#d4f6f3",
          200: "#aceee8",
          300: "#75e0d8",
          400: "#3ecabf",
          500: "#1aada3",
          600: "#128b84",
          700: "#136f6a",
          800: "#155956",
          900: "#154a48"
        }
      }
    }
  },
  plugins: []
};
