/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        foreground: "#ffffff",
        muted: {
          DEFAULT: "#141414",
          foreground: "#71717a",
        },
        border: "#27272a",
        background: "#000000",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
